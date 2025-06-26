import DashboardNavbar from "@/components/dashboard-navbar";
import ManageSubscription from "@/components/manage-subscription";
import { InfoIcon, UserCircle, Zap, BarChart3, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import {
  manageSubscriptionAction,
  getUserSubscriptionTier,
  getMonthlyWordUsage,
} from "../actions";
import { Suspense } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const result = await manageSubscriptionAction(user?.id);
  const tier = await getUserSubscriptionTier(user.id);
  const monthlyUsage = await getMonthlyWordUsage(user.id);

  const tierLimits = {
    free: { perRequest: 250, perMonth: 250, name: "Free Plan" },
    basic: { perRequest: 1000, perMonth: 10000, name: "Basic Plan" },
    pro: { perRequest: 2000, perMonth: 20000, name: "Pro Plan" },
    premium: { perRequest: 5000, perMonth: 35000, name: "Premium Plan" },
  };

  const currentLimits = tierLimits[tier as keyof typeof tierLimits];
  const usagePercentage = (monthlyUsage / currentLimits.perMonth) * 100;

  // Fetch user humanizations
  const { data: chatLogs } = await supabase
    .from("humanizations")
    .select("id, input_text, output_text, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">
                  Welcome Back!
                </h1>
                <p className="text-gray-600">Ready to humanize some AI text?</p>
              </div>
              <div className="flex gap-3">
                <Link href="/ai-humanizer">
                  <Button className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700">
                    <Zap className="h-4 w-4 mr-2" />
                    Start Humanizing
                  </Button>
                </Link>
                <Suspense fallback={<div>Loading...</div>}>
                  {typeof result === "object" && result !== null && "url" in result && result.url && (
                    <ManageSubscription redirectUrl={result.url} />
                  )}
                </Suspense>
              </div>
            </div>
          </header>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-lg">Current Plan</h3>
                  <p className="text-sm text-gray-600">{currentLimits.name}</p>
                </div>
              </div>
              {tier === "free" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-blue-800 font-medium mb-2">
                    🎉 You're on the Free Plan!
                  </p>
                  <p className="text-xs text-blue-700 mb-3">
                    Get started with 250 free words per month. Upgrade anytime
                    for more capacity.
                  </p>
                  <Link href="/pricing">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-xs"
                    >
                      View Plans
                    </Button>
                  </Link>
                </div>
              )}
              {tier !== "free" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-green-800 font-medium mb-2">
                    ✨ {currentLimits.name} Active
                  </p>
                  <p className="text-xs text-green-700">
                    Enjoying premium features with higher limits.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Monthly Usage</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Words Used</span>
                  <span>
                    {monthlyUsage.toLocaleString()} /{" "}
                    {currentLimits.perMonth.toLocaleString()}
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
                <p className="text-xs text-gray-600">
                  {Math.max(
                    0,
                    currentLimits.perMonth - monthlyUsage,
                  ).toLocaleString()}{" "}
                  words remaining this month
                </p>
              </div>
              {usagePercentage > 80 && tier === "free" && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-orange-800 mb-2">
                    ⚠️ You're running low on words. Consider upgrading your
                    plan.
                  </p>
                  <Link href="/pricing">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-xs"
                    >
                      Upgrade Now
                    </Button>
                  </Link>
                </div>
              )}
              {usagePercentage > 80 && tier !== "free" && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-orange-800">
                    ⚠️ You're approaching your monthly limit.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Per Request Limit</h3>
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {currentLimits.perRequest.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">
                Maximum words per humanization request
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <section className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="font-semibold text-xl mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/ai-humanizer" className="group">
                <div className="border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="h-6 w-6 text-blue-600" />
                      <div>
                        <h3 className="font-medium">Humanize Text</h3>
                        <p className="text-sm text-gray-600">
                          Transform AI content instantly
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </Link>

              <Link href="/pricing" className="group">
                <div className="border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                      <div>
                        <h3 className="font-medium">View Plans</h3>
                        <p className="text-sm text-gray-600">
                          Upgrade for more capacity
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </Link>
            </div>
          </section>

          {/* Account Information */}
          <section className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="font-semibold text-xl mb-4">Account Information</h2>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <UserCircle className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="font-semibold text-lg">{user.email}</div>
                  <div className="text-sm text-gray-600">Email: {user.email}</div>
                  <div className="text-sm text-gray-600">Member Since: {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-sm text-gray-600">Plan: <span className="font-semibold">{currentLimits.name}</span></div>
                  <div className="text-sm text-green-600 font-semibold">Status: Active</div>
                </div>
              </div>
            </div>
          </section>

          {/* Chat Logs Section */}
          <section className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="font-semibold text-xl mb-4">Chat Logs</h2>
            <Accordion type="single" collapsible className="w-full">
              {chatLogs && chatLogs.length > 0 ? (
                chatLogs.map((log: any) => (
                  <AccordionItem key={log.id} value={log.id}>
                    <AccordionTrigger>
                      {new Date(log.created_at).toLocaleString()}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="mb-2">
                        <span className="font-semibold text-blue-700">You:</span>
                        <span className="ml-2 text-gray-800">{log.input_text}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-green-700">AI:</span>
                        <span className="ml-2 text-gray-800">{log.output_text}</span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))
              ) : (
                <div className="text-gray-500">No chat logs found.</div>
              )}
            </Accordion>
          </section>
        </div>
      </main>
    </div>
  );
}
