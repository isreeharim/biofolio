import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PublicPageClient } from "./PublicPageClient";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, headline, bio, avatar_url")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profile) {
    return {
      title: "Portfolio Not Found | Biofolio",
    };
  }

  const title = `${profile.display_name} — Portfolio & Work`;
  const description = profile.headline || profile.bio || `Welcome to ${profile.display_name}'s official portfolio on Biofolio.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://biofolio.sreeharim.site/${username}`,
      siteName: "Biofolio",
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  };
}

export default async function PublicPortfolioPage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profile || profile.is_suspended) {
    notFound();
  }

  // Fetch portfolio with sections and items
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select(`
      *,
      portfolio_sections (
        *,
        portfolio_items (*)
      )
    `)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!portfolio || !portfolio.is_published) {
    notFound();
  }

  const sections = portfolio.portfolio_sections || [];
  const linksSec = sections.find((s: any) => s.section_type === "links");
  const projectsSec = sections.find((s: any) => s.section_type === "projects");

  const links = (linksSec?.portfolio_items || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const projects = (projectsSec?.portfolio_items || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const theme = portfolio.theme || { palette: "cream", font: "serif", button: "soft" };

  return (
    <PublicPageClient
      portfolioId={portfolio.id}
      profile={profile}
      theme={theme}
      projects={projects}
      links={links}
      username={username}
    />
  );
}
