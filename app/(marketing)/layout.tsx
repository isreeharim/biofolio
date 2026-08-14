import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0] text-[#14171A]">
      {/* Top Banner */}
      <div className="bg-[#6E5DCD] text-white text-xs font-semibold py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Biofolio V1 is live! Build, customize, and publish your personal portfolio for 100% free.</span>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#FAF6F0]/85 backdrop-blur-md border-b border-[#E4DFDA]/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold font-serif tracking-tight">
            <span className="text-[#6E5DCD] text-2xl font-sans">✦</span>
            <span>biofolio</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B6572]">
            <a href="#features" className="hover:text-[#14171A] transition-colors">Features</a>
            <a href="#templates" className="hover:text-[#14171A] transition-colors">Templates</a>
            <a href="#faq" className="hover:text-[#14171A] transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="gap-1.5 shadow-sm">
                <span>Claim Handle</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Global Footer */}
      <footer className="border-t border-[#E4DFDA] bg-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-[#6B6572]">
          <div className="flex items-center gap-2">
            <span className="text-[#6E5DCD] font-bold">✦</span>
            <span className="font-serif font-bold text-base text-[#14171A]">biofolio</span>
            <span>— The free personal portfolio builder.</span>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <Link href="/login" className="hover:underline">Sign In</Link>
            <Link href="/signup" className="hover:underline">Sign Up with OTP</Link>
            <Link href="/admin" className="hover:underline text-[#6E5DCD] font-medium">Admin Portal</Link>
            <span>© {new Date().getFullYear()} Biofolio. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
