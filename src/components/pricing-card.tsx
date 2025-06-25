"use client";

import { supabase } from "../../supabase/supabase";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { User } from "@supabase/supabase-js";
import { Check } from "lucide-react";

export default function PricingCard({
  item,
  user,
}: {
  item: any;
  user: User | null;
}) {
  // Handle checkout process using predefined checkout links
  const handleCheckout = async (planName: string) => {
    if (!user) {
      // Redirect to login if user is not authenticated
      window.location.href = "/sign-in";
      return;
    }

    // Use predefined checkout links - Updated URLs
    const checkoutLinks = {
      Basic: "https://polar.sh/checkout/7af83f16-219a-4540-a23d-c53a6a601e71",
      Pro: "https://polar.sh/checkout/92eab301-8538-4430-9420-e1bc7a641eca",
      Premium: "https://polar.sh/checkout/7c1f2fde-74ca-42ac-8ff3-9ad1d6972cd1",
    };

    const checkoutUrl = checkoutLinks[planName as keyof typeof checkoutLinks];

    if (checkoutUrl) {
      try {
        // Add user metadata to the URL
        const urlWithParams = new URL(checkoutUrl);
        urlWithParams.searchParams.set("customer_email", user.email || "");
        urlWithParams.searchParams.set(
          "success_url",
          `${window.location.origin}/dashboard`,
        );
        urlWithParams.searchParams.set("metadata[user_id]", user.id);

        console.log("Redirecting to checkout:", urlWithParams.toString());
        window.location.href = urlWithParams.toString();
      } catch (error) {
        console.error("Error creating checkout URL:", error);
        // Fallback to direct URL
        window.location.href = checkoutUrl;
      }
    } else {
      console.error("Invalid plan name:", planName);
      // Fallback to pricing page
      window.location.href = "/pricing";
    }
  };

  return (
    <Card
      className={`w-[350px] relative overflow-hidden ${item.popular ? "border-2 border-blue-500 shadow-xl scale-105" : "border border-gray-200"}`}
    >
      {item.popular && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-30" />
      )}
      <CardHeader className="relative">
        {item.popular && (
          <div className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-teal-600 rounded-full w-fit mb-4">
            Most Popular
          </div>
        )}
        <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
          {item.name}
        </CardTitle>
        <CardDescription className="flex items-baseline gap-2 mt-2">
          <span className="text-4xl font-bold text-gray-900">
            ${(item?.prices?.[0]?.priceAmount / 100).toFixed(2)}
          </span>
          <span className="text-gray-600">/month</span>
        </CardDescription>
      </CardHeader>
      {item.description && (
        <CardContent className="relative">
          <ul className="space-y-4">
            {item.description.split("\n").map((desc: string, index: number) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-gray-600">{desc.trim()}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
      <CardFooter className="relative">
        <Button
          onClick={async () => {
            await handleCheckout(item.name);
          }}
          className={`w-full py-6 text-lg font-medium ${
            item.popular
              ? "bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              : "bg-gray-100 hover:bg-gray-200 text-gray-900"
          }`}
        >
          Get {item.name}
        </Button>
      </CardFooter>
    </Card>
  );
}
