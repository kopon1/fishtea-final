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
  const handleCheckout = () => {
    if (!user) {
      window.location.href = "/sign-in";
      return;
    }

    const productPriceId = item?.prices?.[0]?.id;
    if (!productPriceId) {
      window.location.href = "/pricing";
      return;
    }

    const params = new URLSearchParams();
    params.set("products", productPriceId);
    if (user.id) params.set("customerId", user.id);
    if (user.email) params.set("customerEmail", user.email);
    if (user.user_metadata?.full_name) params.set("customerName", user.user_metadata.full_name);
    params.set("metadata", encodeURIComponent(JSON.stringify({ user_id: user.id })));

    window.location.href = `/checkout?${params.toString()}`;
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
          onClick={handleCheckout}
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
