import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";
import { getUserSubscriptionTier, getMonthlyWordUsage } from "../../actions";

// Function to calculate AI detection probability score
const calculateAIDetectionScore = async (
  text: string,
  groq: any,
): Promise<number> => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an AI detection analyzer. Analyze the given text and provide a probability score (0-100) indicating how likely this text is to be detected as AI-generated. Consider factors like: repetitive patterns, overly formal language, lack of personal touches, perfect grammar, generic phrasing, and structured formatting. Respond with ONLY a number between 0-100, where 0 means definitely human-written and 100 means definitely AI-generated.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      model: "qwen/qwen2-72b-instruct",
      temperature: 0.1,
      max_tokens: 10,
      stream: false,
    });

    const scoreText = completion.choices[0]?.message?.content?.trim() || "50";
    const score = parseInt(scoreText.match(/\d+/)?.[0] || "50");
    return Math.min(Math.max(score, 0), 100);
  } catch (error) {
    console.error("Error calculating AI detection score:", error);
    return 50; // Default fallback score
  }
};

export async function POST(request: NextRequest) {
  const requestId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] Starting streaming humanization request`);

  try {
    const { inputText, strength = 50 } = await request.json();

    if (!inputText) {
      console.log(`[${requestId}] Error: Input text is required`);
      return NextResponse.json(
        { error: "Input text is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log(`[${requestId}] Error: Authentication required`);
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    console.log(`[${requestId}] User authenticated: ${user.id}`);

    // Get user's subscription tier and limits
    const tier = await getUserSubscriptionTier(user.id);
    const monthlyUsage = await getMonthlyWordUsage(user.id);

    console.log(
      `[${requestId}] User tier: ${tier}, Monthly usage: ${monthlyUsage}`,
    );

    const limits = {
      free: { perRequest: 250, perMonth: 250 },
      basic: { perRequest: 1000, perMonth: 10000 },
      pro: { perRequest: 2000, perMonth: 20000 },
      premium: { perRequest: 5000, perMonth: 35000 },
    };

    const userLimits = limits[tier as keyof typeof limits];
    const wordCount = inputText
      .split(/\s+/)
      .filter((word: string) => word.length > 0).length;

    console.log(
      `[${requestId}] Word count: ${wordCount}, Limits: ${userLimits.perRequest}/${userLimits.perMonth}`,
    );

    // Check per-request limit
    if (wordCount > userLimits.perRequest) {
      console.log(`[${requestId}] Error: Per-request limit exceeded`);
      return NextResponse.json(
        {
          error: `Text exceeds ${userLimits.perRequest} word limit for ${tier} plan`,
          needsUpgrade: true,
          currentTier: tier,
        },
        { status: 400 },
      );
    }

    // Check monthly limit
    if (monthlyUsage + wordCount > userLimits.perMonth) {
      console.log(`[${requestId}] Error: Monthly limit exceeded`);
      return NextResponse.json(
        {
          error: `Monthly limit of ${userLimits.perMonth} words exceeded`,
          needsUpgrade: true,
          currentTier: tier,
        },
        { status: 400 },
      );
    }

    // Validate environment variables
    if (!process.env.GROQ_API_KEY) {
      console.error(`[${requestId}] Error: GROQ_API_KEY not configured`);
      return NextResponse.json(
        {
          error: "Service temporarily unavailable. Please try again later.",
        },
        { status: 500 },
      );
    }

    // Initialize Groq client
    const Groq = require("groq-sdk").default;
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    console.log(`[${requestId}] Groq client initialized`);

    // Calculate initial AI detection score
    let initialDetectionScore = 50;
    try {
      initialDetectionScore = await calculateAIDetectionScore(inputText, groq);
      console.log(
        `[${requestId}] Initial detection score: ${initialDetectionScore}%`,
      );
    } catch (scoreError) {
      console.error(
        `[${requestId}] Error calculating initial detection score:`,
        scoreError,
      );
    }

    // Create humanization prompt based on strength
    const strengthPrompts = {
      low: "Lightly rewrite this text to sound more natural and human-like while keeping the same meaning and structure. Make subtle changes to word choice and sentence flow.",
      medium:
        "Rewrite this text to sound like it was written by a real person - casual but intelligent, natural and conversational. Add some personality while maintaining professionalism.",
      high: "Completely rewrite this text to sound authentically human - imperfect, expressive, and natural. Make it bypass AI detection while keeping the core message. Use varied sentence structures, contractions, and natural language patterns.",
    };

    const strengthLevel =
      strength <= 33 ? "low" : strength <= 66 ? "medium" : "high";
    const prompt = strengthPrompts[strengthLevel];

    console.log(`[${requestId}] Using strength level: ${strengthLevel}`);

    // Create a ReadableStream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial detection score
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: "initial_score",
                score: initialDetectionScore,
                requestId,
              })}\n\n`,
            ),
          );

          // Create streaming completion
          const completion = await groq.chat.completions.create({
            messages: [
              {
                role: "system",
                content: `${prompt} Keep the output length similar to the input (within 20% variance). Do not add extra paragraphs or content. Focus on making it sound human and natural. Respond only with the rewritten text, no additional commentary.`,
              },
              {
                role: "user",
                content: inputText,
              },
            ],
            model: "llama3-8b-8192", // Using the specified model
            temperature: Math.min(1.0, 0.7 + (strength / 100) * 0.3),
            max_tokens: Math.min(4096, Math.ceil(wordCount * 2)),
            top_p: 0.9,
            stream: true, // Enable streaming
            stop: null,
          });

          let fullOutput = "";

          // Stream the response
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullOutput += content;
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({
                    type: "content",
                    content,
                    requestId,
                  })}\n\n`,
                ),
              );
            }
          }

          console.log(
            `[${requestId}] Streaming completed, full output length: ${fullOutput.length}`,
          );

          if (!fullOutput.trim()) {
            throw new Error("Empty output from Groq API");
          }

          // Calculate final AI detection score
          let finalDetectionScore = 50;
          try {
            finalDetectionScore = await calculateAIDetectionScore(
              fullOutput,
              groq,
            );
            console.log(
              `[${requestId}] Final detection score: ${finalDetectionScore}%`,
            );
          } catch (scoreError) {
            console.error(
              `[${requestId}] Error calculating final detection score:`,
              scoreError,
            );
            finalDetectionScore = Math.max(0, initialDetectionScore - 20);
          }

          // Log to database
          console.log(`[${requestId}] Logging to database...`);
          const { data: logData, error: logError } = await supabase
            .from("humanizations")
            .insert({
              user_id: user.id,
              input_text: inputText,
              output_text: fullOutput,
              word_count: wordCount,
            })
            .select();

          if (logError) {
            console.error(
              `[${requestId}] Error logging humanization:`,
              logError,
            );
          } else {
            console.log(
              `[${requestId}] Successfully logged to database with ID: ${logData?.[0]?.id}`,
            );
          }

          // Send final data
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: "complete",
                finalScore: finalDetectionScore,
                wordCount,
                tier,
                monthlyUsage: monthlyUsage + wordCount,
                monthlyLimit: userLimits.perMonth,
                requestId,
                success: true,
              })}\n\n`,
            ),
          );

          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();

          console.log(`[${requestId}] Stream completed successfully`);
        } catch (error: any) {
          console.error(`[${requestId}] Streaming error:`, {
            message: error.message,
            status: error.status,
            code: error.code,
            type: error.type,
          });

          // Send error to client
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: "error",
                error: error.message || "Streaming failed",
                requestId,
              })}\n\n`,
            ),
          );

          // Log failed request
          try {
            await supabase.from("humanizations").insert({
              user_id: user.id,
              input_text: inputText,
              output_text: `STREAM_ERROR: ${error.message}`,
              word_count: 0,
            });
          } catch (dbError) {
            console.error(
              `[${requestId}] Failed to log stream error to database:`,
              dbError,
            );
          }

          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error: any) {
    console.error(`[${requestId}] Request setup error:`, error);
    return NextResponse.json(
      { error: "Failed to process request", requestId },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
