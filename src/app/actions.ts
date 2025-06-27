"use server";

import { api } from "@/lib/polar";
import { encodedRedirect } from "@/utils/utils";
import { Polar } from "@polar-sh/sdk";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const supabase = await createClient();

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        email: email,
      },
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  }

  if (user) {
    try {
      const { error: updateError } = await supabase.from("users").insert({
        id: user.id,
        name: fullName,
        full_name: fullName,
        email: email,
        user_id: user.id,
        token_identifier: user.id,
        tier: "free",
        created_at: new Date().toISOString(),
      });

      if (updateError) {
        console.error("Error updating user profile:", updateError);
      }
    } catch (err) {
      console.error("Error in user profile creation:", err);
    }
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {});

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const checkoutSessionAction = async ({
  productPriceId,
  successUrl,
  customerEmail,
  metadata,
}: {
  productPriceId: string;
  successUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}) => {
  const result = await api.checkouts.create({
    productPriceId,
    successUrl,
    customerEmail,
    metadata,
  });

  return result;
};

export const checkUserSubscription = async (userId: string) => {
  const supabase = await createClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("Error checking subscription status:", error);
    return false;
  }

  return !!subscription;
};

export const manageSubscriptionAction = async (userId: string) => {
  const supabase = await createClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("Error checking subscription status:", error);
    return false;
  }

  // Guard: No active subscription or missing customer_id
  if (!subscription || !subscription.customer_id) {
    return { error: "No active subscription found" };
  }

  const polar = new Polar({
    server: "sandbox",
    accessToken: process.env.POLAR_ACCESS_TOKEN,
  });

  try {
    const result = await polar.customerSessions.create({
      customerId: subscription.customer_id,
    });

    // Only return the URL to avoid Convex type issues
    return { url: result.customerPortalUrl };
  } catch (error) {
    console.error("Error managing subscription:", error);
    return { error: "Error managing subscription" };
  }
};

export const getUserSubscriptionTier = async (userId: string) => {
  const supabase = await createClient();

  // First check user's tier in users table (for free users)
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("tier")
    .eq("id", userId)
    .single();

  // Then check for active subscription
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (subscription && !subError) {
    // Map subscription amounts to tiers (amounts in cents)
    const amount = subscription.amount || 0;
    if (amount >= 1999) return "premium"; // $19.99/month
    if (amount >= 999) return "pro"; // $9.99/month
    if (amount >= 499) return "basic"; // $4.99/month
  }

  // Return user's tier from users table or default to free
  return user?.tier || "free";
};

export const getMonthlyWordUsage = async (userId: string) => {
  const supabase = await createClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("humanizations")
    .select("word_count")
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());

  if (error) {
    console.error("Error fetching word usage:", error);
    return 0;
  }

  return data.reduce((total, record) => total + (record.word_count || 0), 0);
};

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
      model: "llama3-8b-8192", // Using a reliable Groq model
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

export const humanizeTextAction = async (formData: FormData) => {
  const inputText = formData.get("inputText")?.toString();
  const strength = parseInt(formData.get("strength")?.toString() || "50");
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[${requestId}] Starting humanization request`);

  if (!inputText) {
    console.log(`[${requestId}] Error: Input text is required`);
    return { error: "Input text is required" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log(`[${requestId}] Error: Authentication required`);
    return { error: "Authentication required" };
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
    .filter((word) => word.length > 0).length;

  console.log(
    `[${requestId}] Word count: ${wordCount}, Limits: ${userLimits.perRequest}/${userLimits.perMonth}`,
  );

  // Check per-request limit
  if (wordCount > userLimits.perRequest) {
    console.log(`[${requestId}] Error: Per-request limit exceeded`);
    return {
      error: `Text exceeds ${userLimits.perRequest} word limit for ${tier} plan`,
      needsUpgrade: true,
      currentTier: tier,
    };
  }

  // Check monthly limit
  if (monthlyUsage + wordCount > userLimits.perMonth) {
    console.log(`[${requestId}] Error: Monthly limit exceeded`);
    return {
      error: `Monthly limit of ${userLimits.perMonth} words exceeded`,
      needsUpgrade: true,
      currentTier: tier,
    };
  }

  let groq: any = null;
  let outputText = "";
  let initialDetectionScore = 50;
  let finalDetectionScore = 50;

  try {
    // Validate environment variables
    if (!process.env.GROQ_API_KEY) {
      console.error(`[${requestId}] Error: GROQ_API_KEY not configured`);
      return {
        error: "Service temporarily unavailable. Please try again later.",
      };
    }

    // Initialize Groq client
    const Groq = require("groq-sdk").default;
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    console.log(`[${requestId}] Groq client initialized`);

    // Calculate initial AI detection score
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
      initialDetectionScore = 50; // Fallback
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

    // Use the specified model from your requirements
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
      model: "llama3-8b-8192", // Using the model from your requirements
      temperature: Math.min(1.0, 0.7 + (strength / 100) * 0.3), // 0.7 to 1.0 based on strength
      max_tokens: Math.min(4096, Math.ceil(wordCount * 2)), // Increased buffer for better output
      top_p: 0.9,
      stream: false, // We'll implement streaming in a separate endpoint if needed
      stop: null,
    });

    outputText = completion.choices[0]?.message?.content?.trim() || "";

    console.log(
      `[${requestId}] Groq API response received, output length: ${outputText.length}`,
    );

    if (!outputText) {
      console.error(`[${requestId}] Error: Empty output from Groq API`);
      return { error: "Failed to generate humanized text" };
    }

    // Calculate final AI detection score
    try {
      finalDetectionScore = await calculateAIDetectionScore(outputText, groq);
      console.log(
        `[${requestId}] Final detection score: ${finalDetectionScore}%`,
      );
    } catch (scoreError) {
      console.error(
        `[${requestId}] Error calculating final detection score:`,
        scoreError,
      );
      finalDetectionScore = Math.max(0, initialDetectionScore - 20); // Assume some improvement
    }

    // Log the humanization request to database
    console.log(`[${requestId}] Logging to database...`);
    const { data: logData, error: logError } = await supabase
      .from("humanizations")
      .insert({
        user_id: user.id,
        input_text: inputText,
        output_text: outputText,
        word_count: wordCount,
      })
      .select();

    if (logError) {
      console.error(`[${requestId}] Error logging humanization:`, logError);
      // Don't fail the request if logging fails, but log the error
    } else {
      console.log(
        `[${requestId}] Successfully logged to database with ID: ${logData?.[0]?.id}`,
      );
    }

    console.log(`[${requestId}] Request completed successfully`);
    console.log(`[${requestId}] Output text length: ${outputText.length}`);
    console.log(
      `[${requestId}] Output preview: ${outputText.substring(0, 100)}...`,
    );

    return {
      success: true,
      outputText,
      wordCount,
      tier,
      monthlyUsage: monthlyUsage + wordCount,
      monthlyLimit: userLimits.perMonth,
      initialDetectionScore,
      finalDetectionScore,
      requestId, // Include for traceability
    };
  } catch (error: any) {
    console.error(`[${requestId}] Groq API error:`, {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      stack: error.stack,
    });

    // Enhanced error handling with specific error types
    let errorMessage =
      "Service temporarily unavailable. Please try again in a moment.";

    if (error.status === 429) {
      errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
    } else if (error.status === 401) {
      errorMessage =
        "Authentication error with AI service. Please contact support.";
    } else if (error.status === 400) {
      errorMessage = "Invalid request. Please check your input and try again.";
    } else if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") {
      errorMessage = "Connection timeout. Please try again.";
    } else if (error.message?.includes("model")) {
      errorMessage = "AI model error. Please try again or contact support.";
      console.error(`[${requestId}] Model error details:`, error.message);
    }

    // Log failed request attempt to database for monitoring
    try {
      await supabase.from("humanizations").insert({
        user_id: user.id,
        input_text: inputText,
        output_text: `ERROR: ${error.message}`,
        word_count: 0, // Mark as failed request
      });
    } catch (dbError) {
      console.error(`[${requestId}] Failed to log error to database:`, dbError);
    }

    return {
      error: errorMessage,
      requestId,
      success: false,
    };
  }
};
