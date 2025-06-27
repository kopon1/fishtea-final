"use client";

import Link from "next/link";
import { createClient } from "../../supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { UserCircle, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardNavbar() {
  const supabase = createClient();
  const router = useRouter();

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            prefetch
            className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent"
          >
            Fish in Tea
          </Link>
        </div>
        <div className="flex gap-2 md:gap-4 items-center">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </Link>
          <Link href="/ai-humanizer">
            <Button
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <span className="hidden sm:inline">AI Humanizer</span>
              <span className="sm:hidden">Humanize</span>
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-700 hover:text-gray-900 hidden md:inline-flex"
            >
              Dashboard
            </Button>
          </Link>
          <Link href="/#pricing" scroll>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-700 hover:text-gray-900 hidden md:inline-flex"
            >
              Pricing
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push("/");
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
