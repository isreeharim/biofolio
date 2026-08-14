"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Sparkles, 
  Check, 
  Layers, 
  BarChart3, 
  Palette, 
  Smartphone, 
  Share2, 
  ShieldCheck, 
  Eye, 
  ExternalLink 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

export default function MarketingPage() {
  const router = useRouter();
  const [handle, setHandle] = React.useState("");
  const [isChecking, setIsChecking] = React.useState(false);
  const [availability, setAvailability] = React.useState<{ available?: boolean; error?: string } | null>(null);
  const [activeTheme, setActiveTheme] = React.useState<"cream" | "lavender" | "ink" | "mint">("cream");

  // Handle availability checker with debounce
  React.useEffect(() => {
    const clean = handle.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
    if (!clean) {
      setAvailability(null);
      setIsChecking(false);
      return;
    }

    if (clean.length < 3) {
      setAvailability({ available: false, error: "Must be at least 3 characters" });
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    const timer = setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", clean)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setAvailability({ available: false, error: "Handle already taken" });
        } else {
          setAvailability({ available: true });
        }
      } catch {
        setAvailability(null);
      } finally {
        setIsChecking(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [handle]);

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = handle.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
    if (clean) {
      router.push(`/signup?handle=${encodeURIComponent(clean)}`);
    } else {
      router.push("/signup");
    }
  };

  return (
    <div className="overflow-hidden">
      {/* 1. Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Copy & Handle Checker */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EDE9FE] text-[#6E5DCD] text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#6E5DCD] animate-pulse" />
              <span>THE FREE NO-CODE PORTFOLIO PLATFORM</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#14171A] leading-[1.12] tracking-tight">
              Your corner of the internet, <br className="hidden sm:block" />
              <span className="italic font-normal text-[#6E5DCD]">beautifully made.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#6B6572] leading-relaxed max-w-xl">
              Create a tactile, fast, and elegant personal website in minutes. Share your projects, showcase your work, and express your identity with zero design stress.
            </p>

            {/* Handle Claim Form */}
            <form onSubmit={handleClaim} className="space-y-3 max-w-md">
              <div className="relative flex items-center bg-white border-2 border-[#E4DFDA] focus-within:border-[#6E5DCD] rounded-2xl p-1.5 shadow-sm transition-all">
                <span className="pl-3.5 text-sm font-mono text-[#918C95] select-none">
                  biofolio.site/
                </span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="yourname"
                  className="w-full bg-transparent px-1 py-2 text-sm font-medium text-[#14171A] focus:outline-none placeholder:text-[#B5B1B9]"
                />
                <Button type="submit" size="default" className="shrink-0 gap-1 rounded-xl">
                  <span>Claim</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Real-time Status Feedback */}
              <div className="text-xs px-2 min-h-[20px] flex items-center gap-1.5">
                {isChecking && <span className="text-[#6B6572]">Checking availability...</span>}
                {!isChecking && availability?.available && (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> biofolio.site/{handle} is available!
                  </span>
                )}
                {!isChecking && availability?.error && (
                  <span className="text-amber-600 font-medium">⚠️ {availability.error}</span>
                )}
                {!isChecking && !availability && (
                  <span className="text-[#918C95]">Pick your unique address. Free forever.</span>
                )}
              </div>
            </form>

            <div className="flex items-center gap-6 pt-2 text-xs text-[#6B6572]">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#6E5DCD]" /> 100% Free V1
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#6E5DCD]" /> No Code Required
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#6E5DCD]" /> Instant OTP Setup
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Live Preview with Theme Switcher */}
          <div className="lg:col-span-5 flex flex-col items-center">
            
            {/* Theme Swatches */}
            <div className="flex items-center gap-2 bg-white/90 border border-[#E4DFDA] px-3.5 py-1.5 rounded-full shadow-sm mb-4">
              <span className="text-xs font-semibold text-[#6B6572] mr-1">Preview Theme:</span>
              <button
                onClick={() => setActiveTheme("cream")}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  activeTheme === "cream" ? "border-[#6E5DCD] scale-110 shadow-sm" : "border-transparent"
                }`}
                style={{ backgroundColor: "#FAF6F0" }}
                title="Cream Theme"
              />
              <button
                onClick={() => setActiveTheme("lavender")}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  activeTheme === "lavender" ? "border-[#6E5DCD] scale-110 shadow-sm" : "border-transparent"
                }`}
                style={{ backgroundColor: "#F4F1FA" }}
                title="Lavender Theme"
              />
              <button
                onClick={() => setActiveTheme("ink")}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  activeTheme === "ink" ? "border-[#6E5DCD] scale-110 shadow-sm" : "border-transparent"
                }`}
                style={{ backgroundColor: "#14171A" }}
                title="Ink Theme"
              />
              <button
                onClick={() => setActiveTheme("mint")}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  activeTheme === "mint" ? "border-[#6E5DCD] scale-110 shadow-sm" : "border-transparent"
                }`}
                style={{ backgroundColor: "#F0F7F4" }}
                title="Mint Theme"
              />
            </div>

            {/* Mobile Phone Mockup */}
            <motion.div
              layout
              className={`w-[320px] rounded-[36px] p-3 shadow-2xl border-4 transition-colors duration-300 ${
                activeTheme === "ink"
                  ? "bg-[#1E232A] border-[#2D333B] text-white"
                  : "bg-white border-[#E4DFDA] text-[#14171A]"
              }`}
            >
              {/* Phone Speaker & Notch */}
              <div className="flex justify-center mb-3">
                <div className="w-20 h-3.5 bg-black/10 rounded-full" />
              </div>

              {/* Profile Card inside Phone */}
              <div
                className={`rounded-2xl p-5 text-center transition-colors duration-300 ${
                  activeTheme === "cream"
                    ? "bg-[#FAF6F0]"
                    : activeTheme === "lavender"
                    ? "bg-[#F4F1FA]"
                    : activeTheme === "ink"
                    ? "bg-[#14171A]"
                    : "bg-[#F0F7F4]"
                }`}
              >
                <div className="w-16 h-16 rounded-full mx-auto bg-gradient-to-tr from-[#6E5DCD] to-[#A78BFA] flex items-center justify-center text-white text-xl font-bold font-serif mb-3 shadow-md">
                  AP
                </div>
                <h2 className="font-serif font-bold text-lg leading-snug">Amelia Parker</h2>
                <p className="text-xs text-[#6B6572] mt-0.5">Product Designer &amp; Illustrator</p>
                <p className="text-[11px] text-[#6B6572]/80 mt-2 leading-relaxed line-clamp-2">
                  Designing thoughtful digital experiences with bold typography and good tea.
                </p>

                {/* Featured Project Showcase */}
                <div className="mt-4 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6572]">Featured Work</span>
                  <div
                    className={`mt-1.5 p-2.5 rounded-xl border transition-all ${
                      activeTheme === "ink"
                        ? "bg-[#1E232A] border-[#2D333B]"
                        : "bg-white border-[#E4DFDA]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-serif">Biofolio Platform</span>
                      <Badge variant="default" className="text-[9px] py-0 px-1.5">SaaS</Badge>
                    </div>
                    <p className="text-[10px] text-[#6B6572] mt-1 line-clamp-2">
                      A no-code portfolio builder with live previews &amp; instant OTP auth.
                    </p>
                  </div>
                </div>

                {/* Links Buttons */}
                <div className="mt-3 space-y-2">
                  <div
                    className={`py-2 px-3 rounded-full text-xs font-medium border flex items-center justify-between transition-all ${
                      activeTheme === "ink"
                        ? "bg-[#1E232A] border-[#2D333B] text-white"
                        : "bg-white border-[#E4DFDA] text-[#14171A]"
                    }`}
                  >
                    <span>Selected Case Studies</span>
                    <span className="text-xs">↗</span>
                  </div>
                  <div
                    className={`py-2 px-3 rounded-full text-xs font-medium border flex items-center justify-between transition-all ${
                      activeTheme === "ink"
                        ? "bg-[#1E232A] border-[#2D333B] text-white"
                        : "bg-white border-[#E4DFDA] text-[#14171A]"
                    }`}
                  >
                    <span>Twitter / X Updates</span>
                    <span className="text-xs">↗</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* 2. Features Grid */}
      <section id="features" className="py-20 bg-white border-y border-[#E4DFDA]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#6E5DCD]">EVERYTHING YOU NEED</p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#14171A]">
              Designed with taste. Built for speed.
            </h2>
            <p className="text-sm sm:text-base text-[#6B6572]">
              Standard link trees are boring. Biofolio turns your links and projects into a cohesive, tactile portfolio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#E4DFDA] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] text-[#6E5DCD] flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-serif text-[#14171A]">Rich Project Showcase</h3>
              <p className="text-sm text-[#6B6572] leading-relaxed">
                Display your best work with image thumbnails, subtitles, descriptions, and custom tag pills.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#E4DFDA] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] text-[#6E5DCD] flex items-center justify-center font-bold">
                <Palette className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-serif text-[#14171A]">Curated Color Palettes</h3>
              <p className="text-sm text-[#6B6572] leading-relaxed">
                Choose from Warm Cream, Soft Lavender, Modern Ink, and Fresh Mint. Perfectly harmonious typography and button tokens.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#E4DFDA] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] text-[#6E5DCD] flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-serif text-[#14171A]">Real-Time Analytics</h3>
              <p className="text-sm text-[#6B6572] leading-relaxed">
                Monitor real page views, link clicks, device splits, and top performing destinations without cookies or privacy invasions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 3-Step Walkthrough */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[#6E5DCD]">HOW IT WORKS</p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#14171A]">
            From zero to published in 3 steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-3 p-6">
            <span className="w-12 h-12 rounded-full bg-[#6E5DCD] text-white font-bold text-lg flex items-center justify-center mx-auto shadow-md">1</span>
            <h3 className="text-xl font-bold font-serif">Claim your handle</h3>
            <p className="text-sm text-[#6B6572]">
              Pick your personalized web address: <code className="text-xs bg-white px-2 py-0.5 rounded border">biofolio.site/you</code>
            </p>
          </div>

          <div className="text-center space-y-3 p-6">
            <span className="w-12 h-12 rounded-full bg-[#6E5DCD] text-white font-bold text-lg flex items-center justify-center mx-auto shadow-md">2</span>
            <h3 className="text-xl font-bold font-serif">Customize with live preview</h3>
            <p className="text-sm text-[#6B6572]">
              Add your projects, links, and avatar. Reorder blocks visually using drag-and-drop.
            </p>
          </div>

          <div className="text-center space-y-3 p-6">
            <span className="w-12 h-12 rounded-full bg-[#6E5DCD] text-white font-bold text-lg flex items-center justify-center mx-auto shadow-md">3</span>
            <h3 className="text-xl font-bold font-serif">Publish &amp; Share</h3>
            <p className="text-sm text-[#6B6572]">
              Hit publish and add your link to Instagram, Twitter, LinkedIn, and your resume.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Bottom CTA */}
      <section className="py-20 bg-[#14171A] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <span className="text-[#A78BFA] text-2xl">✦</span>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight">
            Claim your personal link today.
          </h2>
          <p className="text-[#A09CA6] max-w-lg mx-auto text-base">
            Free forever. No credit card required. Verify with 6-digit email OTP and start building.
          </p>
          <div className="pt-2">
            <Link href="/signup">
              <Button size="lg" className="bg-[#6E5DCD] hover:bg-[#5C4BB7] text-white text-base px-8 rounded-full shadow-lg">
                <span>Get Started with OTP</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
