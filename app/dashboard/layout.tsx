"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  Undo2, 
  Redo2, 
  ExternalLink, 
  LogOut, 
  Check, 
  Loader2, 
  ShieldCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBuilderStore } from "@/lib/store/useBuilderStore";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const {
    slug,
    isPublished,
    setIsPublished,
    isDirty,
    isSaving,
    undo,
    redo,
    past,
    future,
    hydrateState,
  } = useBuilderStore();

  const [userEmail, setUserEmail] = React.useState<string>("");
  const [isAdmin, setIsAdmin] = React.useState(false);

  // Load session & existing portfolio from Supabase on mount
  React.useEffect(() => {
    async function loadUserPortfolio() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        setUserEmail(user.email || "");

        // Fetch user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          setIsAdmin(profile.role === "admin");
        }

        // Fetch portfolio
        const { data: portfolio } = await supabase
          .from("portfolios")
          .select(`
            *,
            portfolio_sections (
              *,
              portfolio_items (*)
            )
          `)
          .eq("user_id", user.id)
          .single();

        if (portfolio) {
          // Extract links and projects from sections
          const sections = portfolio.portfolio_sections || [];
          const linksSec = sections.find((s: any) => s.section_type === "links");
          const projectsSec = sections.find((s: any) => s.section_type === "projects");

          const loadedLinks = (linksSec?.portfolio_items || []).sort(
            (a: any, b: any) => a.sort_order - b.sort_order
          );
          const loadedProjects = (projectsSec?.portfolio_items || []).sort(
            (a: any, b: any) => a.sort_order - b.sort_order
          );

          hydrateState({
            portfolioId: portfolio.id,
            slug: portfolio.slug,
            isPublished: portfolio.is_published,
            theme: portfolio.theme || { palette: "cream", font: "serif", button: "soft" },
            profile: {
              displayName: profile?.display_name || "",
              headline: profile?.headline || "",
              bio: profile?.bio || "",
              avatarUrl: profile?.avatar_url || "",
            },
            links: loadedLinks.map((l: any) => ({
              id: l.id,
              title: l.title,
              url: l.url,
              icon: l.icon || "↗",
            })),
            projects: loadedProjects.map((p: any) => ({
              id: p.id,
              title: p.title,
              subtitle: p.subtitle,
              description: p.description,
              url: p.url,
              imageUrl: p.image_url,
              tags: p.tags || [],
            })),
          });
        }
      } catch (err: any) {
        console.warn("Portfolio hydration error:", err);
      }
    }

    loadUserPortfolio();
  }, [router, hydrateState]);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("Signed out");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to sign out");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0] text-[#14171A]">
      {/* Studio Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E4DFDA] px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-serif font-bold text-lg">
            <span className="text-[#6E5DCD] text-xl font-sans">✦</span>
            <span>biofolio</span>
            <Badge variant="secondary" className="text-[10px] ml-1 uppercase">
              Studio
            </Badge>
          </Link>

          {/* Undo / Redo Controls */}
          <div className="hidden sm:flex items-center gap-1 border-l border-[#E4DFDA] pl-4">
            <button
              onClick={undo}
              disabled={past.length === 0}
              className="p-1.5 rounded-lg text-[#6B6572] hover:text-[#14171A] hover:bg-[#FAF6F0] disabled:opacity-30 disabled:pointer-events-none transition-all"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={future.length === 0}
              className="p-1.5 rounded-lg text-[#6B6572] hover:text-[#14171A] hover:bg-[#FAF6F0] disabled:opacity-30 disabled:pointer-events-none transition-all"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link href="/admin">
              <Button variant="secondary" size="sm" className="hidden md:flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Button>
            </Link>
          )}

          {/* Live Link Button */}
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex"
          >
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <span>View Site</span>
              <ExternalLink className="w-3 h-3" />
            </Button>
          </a>

          {/* Publish Toggle Button */}
          <Button
            size="sm"
            onClick={() => setIsPublished(!isPublished)}
            className={`gap-1.5 text-xs rounded-full shadow-xs ${
              isPublished
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-[#14171A] text-white"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isPublished ? "bg-white animate-pulse" : "bg-gray-400"}`} />
            <span>{isPublished ? "Published" : "Draft"}</span>
          </Button>

          {/* User Sign Out */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-8 w-8 text-[#6B6572] hover:text-[#14171A]"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
