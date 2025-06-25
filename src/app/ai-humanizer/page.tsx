"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { humanizeTextAction, checkoutSessionAction } from "@/app/actions";
import {
  Wand2,
  Copy,
  BarChart3,
  Zap,
  Shield,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "../../../supabase/client";

interface UserData {
  tier: string;
  monthlyUsage: number;
  monthlyLimit: number;
}

interface DetectionScores {
  initial: number | null;
  final: number | null;
}

export default function AIHumanizerPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [strength, setStrength] = useState([50]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [user, setUser] = useState<any>(null);
  const [detectionScores, setDetectionScores] = useState<DetectionScores>({
    initial: null,
    final: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const wordCount = inputText
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const outputWordCount = outputText
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  const tierLimits = {
    free: { perRequest: 250, perMonth: 250, name: "Free" },
    basic: { perRequest: 1000, perMonth: 10000, name: "Basic" },
    pro: { perRequest: 2000, perMonth: 20000, name: "Pro" },
    premium: { perRequest: 5000, perMonth: 35000, name: "Premium" },
  };

  const handleHumanize = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter some text to humanize.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use the AI Humanizer.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("inputText", inputText);
      formData.append("strength", strength[0].toString());

      const result = await humanizeTextAction(formData);

      console.log("Humanization result:", result);

      if (result.error) {
        console.error("Humanization error:", result.error);
        if (result.needsUpgrade) {
          toast({
            title: "Upgrade Required",
            description: result.error,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          });
        }
        return;
      }

      if (result.success) {
        console.log(
          "Setting output text:",
          result.outputText?.substring(0, 100),
        );
        setOutputText(result.outputText || "");
        setUserData({
          tier: result.tier,
          monthlyUsage: result.monthlyUsage,
          monthlyLimit: result.monthlyLimit,
        });
        setDetectionScores({
          initial: result.initialDetectionScore || null,
          final: result.finalDetectionScore || null,
        });
        toast({
          title: "Success!",
          description: "Text has been humanized successfully.",
        });
      } else {
        console.error("Humanization failed - no success flag");
        toast({
          title: "Error",
          description: "Failed to humanize text. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Humanization request error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy text to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleUpgrade = async (planName: string) => {
    if (!user) return;

    // Use predefined checkout links for direct upgrade
    const checkoutLinks = {
      basic: "https://polar.sh/checkout/7af83f16-219a-4540-a23d-c53a6a601e71",
      pro: "https://polar.sh/checkout/92eab301-8538-4430-9420-e1bc7a641eca",
      premium: "https://polar.sh/checkout/7c1f2fde-74ca-42ac-8ff3-9ad1d6972cd1",
    };

    const checkoutUrl =
      checkoutLinks[planName.toLowerCase() as keyof typeof checkoutLinks];

    if (checkoutUrl) {
      // Add user metadata to the URL
      const urlWithParams = new URL(checkoutUrl);
      urlWithParams.searchParams.set("customer_email", user.email || "");
      urlWithParams.searchParams.set(
        "success_url",
        `${window.location.origin}/dashboard`,
      );
      urlWithParams.searchParams.set("metadata[user_id]", user.id);

      window.location.href = urlWithParams.toString();
    } else {
      // Fallback to pricing page
      window.location.href = "/pricing";
    }
  };

  const getStrengthLabel = (value: number) => {
    if (value <= 33) return "Light";
    if (value <= 66) return "Medium";
    return "Strong";
  };

  const getDetectionScoreColor = (score: number) => {
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-orange-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const getDetectionScoreLabel = (score: number) => {
    if (score >= 80) return "Very High Risk";
    if (score >= 60) return "High Risk";
    if (score >= 40) return "Medium Risk";
    if (score >= 20) return "Low Risk";
    return "Very Low Risk";
  };

  const currentTier = userData?.tier || "free";
  const currentLimits = tierLimits[currentTier as keyof typeof tierLimits];
  const usagePercentage = userData
    ? (userData.monthlyUsage / userData.monthlyLimit) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      {/* Navigation */}
      <nav className="w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent"
          >
            Fish in Tea
          </Link>
          <div className="flex gap-2 items-center">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
              >
                Upgrade
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-4">
            AI Text Humanizer
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform AI-generated content into natural, human-like writing that
            bypasses AI detectors while maintaining your message's intent.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Shield className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Bypass AI Detection</h3>
              <p className="text-sm text-gray-600">
                Evade GPTZero, ZeroGPT, Winston, and other AI detectors
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Zap className="h-8 w-8 text-teal-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Instant Processing</h3>
              <p className="text-sm text-gray-600">
                Get humanized text in seconds with Groq's lightning-fast AI
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Natural & Expressive</h3>
              <p className="text-sm text-gray-600">
                Casual but intelligent tone that sounds authentically human
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Usage Stats */}
        {userData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Your Usage -{" "}
                {tierLimits[currentTier as keyof typeof tierLimits].name} Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Monthly Usage</span>
                  <span>
                    {userData.monthlyUsage.toLocaleString()} /{" "}
                    {userData.monthlyLimit.toLocaleString()} words
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
                {usagePercentage > 80 && (
                  <p className="text-sm text-orange-600">
                    You're approaching your monthly limit. Consider upgrading
                    for more capacity.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Editor */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Input Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Input Text</CardTitle>
              <CardDescription>
                Paste your AI-generated content here (up to{" "}
                {currentLimits.perRequest} words)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your AI-generated text here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[300px] resize-none"
              />
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Words: {wordCount}</span>
                <span
                  className={
                    wordCount > currentLimits.perRequest
                      ? "text-red-600 font-medium"
                      : ""
                  }
                >
                  Limit: {currentLimits.perRequest}
                </span>
              </div>
              {detectionScores.initial !== null && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">
                      AI Detection Risk:
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-bold ${getDetectionScoreColor(
                          detectionScores.initial,
                        )}`}
                      >
                        {detectionScores.initial}%
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          detectionScores.initial >= 80
                            ? "bg-red-100 text-red-700"
                            : detectionScores.initial >= 60
                              ? "bg-orange-100 text-orange-700"
                              : detectionScores.initial >= 40
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                        }`}
                      >
                        {getDetectionScoreLabel(detectionScores.initial)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {wordCount > currentLimits.perRequest && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ Text exceeds your {currentLimits.perRequest} word limit.
                    Please shorten your text or upgrade your plan.
                  </p>
                </div>
              )}
              {userData && userData.monthlyUsage >= userData.monthlyLimit && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
                  <p className="text-sm text-orange-800 font-medium">
                    📊 You've reached your monthly limit of{" "}
                    {userData.monthlyLimit} words. Upgrade to continue
                    humanizing text.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Output Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Humanized Text</CardTitle>
              <CardDescription>
                Your natural, human-like content appears here
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isProcessing ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="text-center text-sm text-gray-600 mt-4">
                    <Wand2 className="h-4 w-4 animate-spin inline mr-2" />
                    Humanizing your text...
                  </div>
                </div>
              ) : (
                <Textarea
                  placeholder="Humanized text will appear here..."
                  value={outputText}
                  readOnly
                  className="min-h-[300px] resize-none bg-gray-50"
                />
              )}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Words: {outputWordCount}
                  </span>
                  {outputText && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(outputText)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  )}
                </div>
                {detectionScores.final !== null && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">
                        AI Detection Risk (After):
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold ${getDetectionScoreColor(
                            detectionScores.final,
                          )}`}
                        >
                          {detectionScores.final}%
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            detectionScores.final >= 80
                              ? "bg-red-100 text-red-700"
                              : detectionScores.final >= 60
                                ? "bg-orange-100 text-orange-700"
                                : detectionScores.final >= 40
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                          }`}
                        >
                          {getDetectionScoreLabel(detectionScores.final)}
                        </span>
                      </div>
                    </div>
                    {detectionScores.initial !== null && (
                      <div className="mt-2 text-xs text-green-700">
                        Improvement:{" "}
                        <span className="font-semibold">
                          {detectionScores.initial - detectionScores.final > 0
                            ? `-${detectionScores.initial - detectionScores.final}%`
                            : `+${detectionScores.final - detectionScores.initial}%`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Humanization Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium">
                  Humanization Strength
                </label>
                <span className="text-sm text-gray-600">
                  {getStrengthLabel(strength[0])}
                </span>
              </div>
              <Slider
                value={strength}
                onValueChange={setStrength}
                max={100}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Light</span>
                <span>Medium</span>
                <span>Strong</span>
              </div>
            </div>

            <Button
              onClick={handleHumanize}
              disabled={
                !inputText.trim() ||
                isProcessing ||
                wordCount > currentLimits.perRequest ||
                (userData && userData.monthlyUsage >= userData.monthlyLimit)
              }
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                  Humanizing...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Humanize Text
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Upgrade Options */}
        {currentTier !== "premium" && (
          <Card>
            <CardHeader>
              <CardTitle>Need More Capacity?</CardTitle>
              <CardDescription>
                Upgrade your plan for higher word limits and more features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {currentTier === "free" && (
                  <>
                    <div className="border rounded-lg p-4 text-center">
                      <h3 className="font-semibold mb-2">Basic</h3>
                      <p className="text-2xl font-bold mb-2">$4.99/mo</p>
                      <p className="text-sm text-gray-600 mb-4">
                        1,000 words/request
                        <br />
                        10,000 words/month
                      </p>
                      <Button
                        onClick={() => handleUpgrade("basic")}
                        className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                      >
                        Get Basic - $4.99/mo
                      </Button>
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <h3 className="font-semibold mb-2">Pro</h3>
                      <p className="text-2xl font-bold mb-2">$9.99/mo</p>
                      <p className="text-sm text-gray-600 mb-4">
                        2,000 words/request
                        <br />
                        20,000 words/month
                      </p>
                      <Button
                        onClick={() => handleUpgrade("pro")}
                        className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                      >
                        Get Pro - $9.99/mo
                      </Button>
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <h3 className="font-semibold mb-2">Premium</h3>
                      <p className="text-2xl font-bold mb-2">$19.99/mo</p>
                      <p className="text-sm text-gray-600 mb-4">
                        5,000 words/request
                        <br />
                        35,000 words/month
                      </p>
                      <Button
                        onClick={() => handleUpgrade("premium")}
                        className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                      >
                        Get Premium - $19.99/mo
                      </Button>
                    </div>
                  </>
                )}
                {currentTier === "basic" && (
                  <>
                    <div className="border rounded-lg p-4 text-center">
                      <h3 className="font-semibold mb-2">Pro</h3>
                      <p className="text-2xl font-bold mb-2">$9.99/mo</p>
                      <p className="text-sm text-gray-600 mb-4">
                        2,000 words/request
                        <br />
                        20,000 words/month
                      </p>
                      <Button
                        onClick={() => handleUpgrade("pro")}
                        className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                      >
                        Get Pro - $9.99/mo
                      </Button>
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <h3 className="font-semibold mb-2">Premium</h3>
                      <p className="text-2xl font-bold mb-2">$19.99/mo</p>
                      <p className="text-sm text-gray-600 mb-4">
                        5,000 words/request
                        <br />
                        35,000 words/month
                      </p>
                      <Button
                        onClick={() => handleUpgrade("premium")}
                        className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                      >
                        Get Premium - $19.99/mo
                      </Button>
                    </div>
                  </>
                )}
                {currentTier === "pro" && (
                  <div className="border rounded-lg p-4 text-center">
                    <h3 className="font-semibold mb-2">Premium</h3>
                    <p className="text-2xl font-bold mb-2">$19.99/mo</p>
                    <p className="text-sm text-gray-600 mb-4">
                      5,000 words/request
                      <br />
                      50,000 words/month
                    </p>
                    <Button
                      onClick={() => handleUpgrade("premium")}
                      className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                    >
                      Get Premium - $19.99/mo
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
