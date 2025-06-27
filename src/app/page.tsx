import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import PricingCard from "@/components/pricing-card";
import { ArrowUpRight, CheckCircle2, Shield, Users, Zap } from "lucide-react";
import { createClient } from "../../supabase/server";
import { useEffect, useState } from "react"
// @ts-ignore
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

function UpgradeButton({ planKey, children, className }: { planKey: string; children: React.ReactNode; className?: string }) {
  const [user, setUser] = useState<any>(null)
  useEffect(() => {
    const supabase = createClientComponentClient()
    supabase.auth.getUser().then((result: { data: { user: any } }) => setUser(result.data.user))
  }, [])

  const checkoutLinks = {
    basic: "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_g9vUjb1pCNJkSHYwIsO9jmB57a8vM4zmlhDGM2jyZdp/redirect",
    pro: "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_RdglhsWU6q0hcbcbXYAla4ZUAOPMf6bbXqNtV1KgcuR/redirect",
    premium: "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_UU4n1I1GXLq78y7xp9hdMfpRKHhSvYqUPiUJT1NzNoj/redirect",
  }

  const handleClick = () => {
    const checkoutUrl = checkoutLinks[planKey as keyof typeof checkoutLinks]
    if (!checkoutUrl) return
    if (user) {
      const urlWithParams = new URL(checkoutUrl)
      urlWithParams.searchParams.set("customer_email", user.email || "")
      urlWithParams.searchParams.set("success_url", `${window.location.origin}/dashboard`)
      urlWithParams.searchParams.set("metadata[user_id]", user.id)
      window.location.href = urlWithParams.toString()
    } else {
      window.location.href = checkoutUrl
    }
  }

  return (
    <button className={className} onClick={handleClick}>{children}</button>
  )
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: plans, error } = await supabase.functions.invoke(
    "supabase-functions-get-plans",
  );

  const result = plans?.items;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Fish in Tea</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The most advanced AI text humanization platform that seamlessly
              blends artificial intelligence with natural human expression.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: "One-Click Humanize",
                description:
                  "Transform AI text instantly with our advanced algorithms",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Bypass AI Detectors",
                description: "Undetectable by leading AI detection tools",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Preserve Intent",
                description:
                  "Maintain original meaning while improving naturalness",
              },
              {
                icon: <CheckCircle2 className="w-6 h-6" />,
                title: "Quality Guaranteed",
                description: "Human-like writing that passes every test",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-blue-100"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10M+</div>
              <div className="text-blue-100">Words Humanized</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-blue-100">Detection Bypass Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-blue-100">Happy Writers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan for your humanization needs. Scale as you
              grow.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch max-w-5xl mx-auto">
            {/* Basic Plan */}
            <div className="relative flex-1 bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col p-8 transition-transform hover:scale-[1.03] justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 text-center">Basic Plan</h3>
                <div className="text-center mb-1">
                  <span className="text-3xl font-extrabold text-blue-600">$4.99</span>
                  <span className="text-gray-500 text-lg font-medium">/month</span>
                </div>
                <p className="text-gray-600 text-center mb-6">For individual creators</p>
                <ul className="mb-8 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-800"><svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>10,000 words per month</li>
                  <li className="flex items-center gap-2 text-sm text-gray-800"><svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>1,000 words per request</li>
                  <li className="flex items-center gap-2 text-sm text-gray-800"><svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Email support</li>
                  <li className="flex items-center gap-2 text-sm text-gray-400 line-through"><svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>20,000 words per month</li>
                  <li className="flex items-center gap-2 text-sm text-gray-400 line-through"><svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>2,000 words per request</li>
                  <li className="flex items-center gap-2 text-sm text-gray-400 line-through"><svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>Priority support</li>
                  <li className="flex items-center gap-2 text-sm text-gray-400 line-through"><svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>35,000 words per month</li>
                  <li className="flex items-center gap-2 text-sm text-gray-400 line-through"><svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>5,000 words per request</li>
                  <li className="flex items-center gap-2 text-sm text-gray-400 line-through"><svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>24/7 priority support</li>
                </ul>
              </div>
              <UpgradeButton planKey="basic" className="w-full py-3 text-base font-semibold rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 text-center block mt-auto">Get Basic</UpgradeButton>
            </div>
            {/* Pro Plan */}
            <div className="relative flex-1 bg-white rounded-2xl shadow-lg border-2 border-blue-500 shadow-xl z-10 flex flex-col p-8 transition-transform hover:scale-[1.03] justify-between">
              <div>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-semibold px-4 py-1 rounded-full shadow">Most Popular</div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 text-center">Pro Plan</h3>
                <div className="text-center mb-1">
                  <span className="text-3xl font-extrabold text-blue-600">$9.99</span>
                  <span className="text-gray-500 text-lg font-medium">/month</span>
                </div>
                <p className="text-gray-600 text-center mb-6">For content professionals</p>
                <ul className="mb-8 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-800"><svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Everything in Basic</li>
                  <li className="flex items-center gap-2 text-sm text-gray-800"><svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>20,000 words per month</li>
                  <li className="flex items-center gap-2 text-sm text-gray-800"><svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>2,000 words per request</li>
                  <li className="flex items-center gap-2 text-sm text-gray-800"><svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Priority support</li>
                  <li className="flex items-center gap-2 text-sm text-gray-400 line-through"><svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>35,000 words per month</li>
                  <li className="flex items-center gap-2 text-sm text-gray-400 line-through"><svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>5,000 words per request</li>
                  <li className="flex items-center gap-2 text-sm text-gray-400 line-through"><svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>24/7 priority support</li>
                </ul>
              </div>
              <UpgradeButton planKey="pro" className="w-full py-3 text-base font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white text-center block mt-auto">Get Pro</UpgradeButton>
            </div>
            {/* Premium Plan */}
            <div className="relative flex-1 bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col p-8 transition-transform hover:scale-[1.03] justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 text-center">Premium Plan</h3>
                <div className="text-center mb-1">
                  <span className="text-3xl font-extrabold text-blue-600">$19.99</span>
                  <span className="text-gray-500 text-lg font-medium">/month</span>
                </div>
                <p className="text-gray-600 text-center mb-6">For teams</p>
                <ul className="mb-8 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-800"><svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Everything in Pro</li>
                  <li className="flex items-center gap-2 text-sm text-gray-800"><svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>35,000 words per month</li>
                  <li className="flex items-center gap-2 text-sm text-gray-800"><svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>5,000 words per request</li>
                  <li className="flex items-center gap-2 text-sm text-gray-800"><svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>24/7 priority support</li>
                </ul>
              </div>
              <UpgradeButton planKey="premium" className="w-full py-3 text-base font-semibold rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 text-center block mt-auto">Get Premium</UpgradeButton>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Humanize Your AI Content?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of writers, marketers, and content creators who trust
            Fish in Tea to make their AI content undetectable.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Start Humanizing Now
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Background gradient */}
      {/* <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50 opacity-70" /> */}

      <Footer />
    </div>
  );
}
