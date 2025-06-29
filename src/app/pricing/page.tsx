"use client";
import { Button } from "@/components/ui/button"
import clsx from "clsx"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
// @ts-ignore
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

const plans = [
  {
    name: "Basic Plan",
    price: "$4.99",
    period: "/month",
    description: "For individual creators",
    features: [
      { label: "10,000 words per month", included: true },
      { label: "1,000 words per request", included: true },
      { label: "Email support", included: true },
      { label: "20,000 words per month", included: false },
      { label: "2,000 words per request", included: false },
      { label: "Priority support", included: false },
      { label: "35,000 words per month", included: false },
      { label: "5,000 words per request", included: false },
      { label: "24/7 priority support", included: false },
    ],
    cta: "Get Basic",
    highlight: false,
    planKey: "basic",
  },
  {
    name: "Pro Plan",
    price: "$9.99",
    period: "/month",
    description: "For content professionals",
    features: [
      { label: "Everything in Basic", included: true },
      { label: "20,000 words per month", included: true },
      { label: "2,000 words per request", included: true },
      { label: "Priority support", included: true },
      { label: "35,000 words per month", included: false },
      { label: "5,000 words per request", included: false },
      { label: "24/7 priority support", included: false },
    ],
    cta: "Get Pro",
    highlight: true,
    badge: "Most Popular",
    planKey: "pro",
  },
  {
    name: "Premium Plan",
    price: "$19.99",
    period: "/month",
    description: "For teams",
    features: [
      { label: "Everything in Pro", included: true },
      { label: "35,000 words per month", included: true },
      { label: "5,000 words per request", included: true },
      { label: "24/7 priority support", included: true },
    ],
    cta: "Get Premium",
    highlight: false,
    planKey: "premium",
  },
]

function BackToDashboard() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-8 transition-colors" aria-label="Back to dashboard">
      <ArrowLeft className="w-5 h-5" />
      Back to Dashboard
    </Link>
  )
}

function UpgradeButton({ planKey, children, className }: { planKey: string; children: React.ReactNode; className?: string }) {
  const router = useRouter()
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
    <Button className={className} size="lg" onClick={handleClick}>{children}</Button>
  )
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-16">
      <div className="max-w-5xl mx-auto px-4">
        <BackToDashboard />
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Choose Your Plan
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Select the perfect plan for your content creation needs. All plans include our core features with varying usage limits.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
          {plans.map((plan, idx) => (
            <div
              key={plan.name}
              className={clsx(
                "relative flex-1 bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col p-8 transition-transform hover:scale-[1.03] justify-between",
                plan.highlight && "border-2 border-blue-500 shadow-xl z-10"
              )}
            >
              <div>
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-semibold px-4 py-1 rounded-full shadow">
                    {plan.badge}
                  </div>
                )}
                <h2 className="text-2xl font-bold mb-2 text-gray-900 text-center">{plan.name}</h2>
                <div className="text-center mb-1">
                  <span className="text-3xl font-extrabold text-blue-600">{plan.price}</span>
                  <span className="text-gray-500 text-lg font-medium">{plan.period}</span>
                </div>
                <p className="text-gray-600 text-center mb-6">{plan.description}</p>
                <ul className="mb-8 space-y-2">
                  {plan.features.map((feature, i) => (
                    <li
                      key={feature.label}
                      className={clsx(
                        "flex items-center gap-2 text-sm",
                        feature.included ? "text-gray-800" : "text-gray-400 line-through"
                      )}
                    >
                      {feature.included ? (
                        <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      )}
                      {feature.label}
                    </li>
                  ))}
                </ul>
              </div>
              <UpgradeButton
                planKey={plan.planKey}
                className={clsx(
                  "w-full py-3 text-base font-semibold rounded-lg mt-auto",
                  plan.highlight
                    ? "bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                )}
              >
                {plan.cta}
              </UpgradeButton>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 