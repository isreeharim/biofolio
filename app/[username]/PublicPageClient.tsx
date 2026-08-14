"use client";

import * as React from "react";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flag, Share2, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface PublicPageClientProps {
  portfolioId: string;
  profile: any;
  theme: any;
  projects: any[];
  links: any[];
  username: string;
}

export function PublicPageClient({
  portfolioId,
  profile,
  theme,
  projects,
  links,
  username,
}: PublicPageClientProps) {
  const [reportModalOpen, setReportModalOpen] = React.useState(false);
  const [reportReason, setReportReason] = React.useState("Spam / Phishing");
  const [reportDetails, setReportDetails] = React.useState("");
  const [isSubmittingReport, setIsSubmittingReport] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Automatically log page view event on mount
  React.useEffect(() => {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portfolioId,
        eventType: "page_view",
        path: `/${username}`,
      }),
    }).catch(() => {});
  }, [portfolioId, username]);

  // Log link click event
  const handleLinkClick = (itemId: string) => {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portfolioId,
        eventType: "link_click",
        itemId,
        path: `/${username}`,
      }),
    }).catch(() => {});
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${profile.display_name} — Biofolio`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Portfolio link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingReport(true);
      const supabase = createClient();

      const { error } = await supabase.from("content_reports").insert({
        portfolio_id: portfolioId,
        reason: reportReason,
        details: reportDetails.trim() || null,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Thank you. Report submitted for moderator review.");
      setReportModalOpen(false);
      setReportDetails("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit report");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const themeClass = `theme-${theme.palette || "cream"}`;
  const fontClass = `font-${theme.font || "serif"}`;
  const buttonClass = `button-${theme.button || "soft"}`;

  return (
    <div
      className={`min-h-screen ${themeClass} ${fontClass} ${buttonClass} flex flex-col items-center justify-between p-4 sm:p-8 transition-colors duration-300`}
      style={{
        backgroundColor: "var(--portfolio-bg)",
        color: "var(--portfolio-text)",
      }}
    >
      {/* Top Floating Controls */}
      <div className="w-full max-w-lg flex items-center justify-between py-2">
        <Link
          href="/"
          className="text-xs font-serif font-bold opacity-75 hover:opacity-100 transition-opacity flex items-center gap-1.5"
        >
          <span className="text-[#6E5DCD] text-sm font-sans">✦</span>
          <span>biofolio</span>
        </Link>

        <button
          onClick={handleShare}
          className="text-xs font-semibold px-3 py-1.5 rounded-full border border-black/10 bg-white/60 hover:bg-white text-[#14171A] flex items-center gap-1.5 shadow-xs transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied" : "Share"}</span>
        </button>
      </div>

      {/* Main Profile Card Container */}
      <main className="w-full max-w-lg space-y-8 my-auto py-8">
        
        {/* Header Profile Section */}
        <div className="text-center space-y-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-tr from-[#6E5DCD] to-[#A78BFA] text-white flex items-center justify-center text-3xl font-bold font-serif shadow-lg">
              {getInitials(profile.display_name)}
            </div>
          )}

          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {profile.display_name}
            </h1>
            {profile.headline && (
              <p className="text-sm font-medium opacity-80 mt-1">
                {profile.headline}
              </p>
            )}
          </div>

          {profile.bio && (
            <p className="text-sm opacity-80 leading-relaxed max-w-md mx-auto">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Featured Projects Section */}
        {projects.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest opacity-60 text-center">
              Featured Work
            </h2>
            <div className="space-y-4">
              {projects.map((project) => (
                <a
                  key={project.id}
                  href={project.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleLinkClick(project.id)}
                  className="block p-5 rounded-2xl border border-black/10 bg-white text-[#14171A] hover:border-[#6E5DCD] hover:shadow-md transition-all group"
                >
                  {project.image_url && (
                    <div className="rounded-xl overflow-hidden h-44 mb-4 bg-black/5">
                      <img
                        src={project.image_url}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base font-serif">{project.title}</h3>
                      {project.subtitle && (
                        <p className="text-xs text-[#6B6572] font-medium mt-0.5">
                          {project.subtitle}
                        </p>
                      )}
                    </div>
                    {project.url && <ExternalLink className="w-4 h-4 text-[#918C95] group-hover:text-[#6E5DCD]" />}
                  </div>

                  {project.description && (
                    <p className="text-xs text-[#6B6572] mt-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}

                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {project.tags.map((tag: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] py-0.5 px-2 font-normal">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Links Section */}
        {links.length > 0 && (
          <div className="space-y-3 pt-2">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(link.id)}
                className="theme-button-style flex items-center justify-between p-4 border border-black/10 bg-white text-[#14171A] hover:border-[#6E5DCD] hover:shadow-sm text-sm font-medium transition-all"
              >
                <span className="truncate">{link.title}</span>
                <span className="font-mono text-xs opacity-75">{link.icon || "↗"}</span>
              </a>
            ))}
          </div>
        )}

      </main>

      {/* Public Footer */}
      <footer className="w-full max-w-lg py-6 text-center text-xs opacity-60 flex items-center justify-between">
        <button
          onClick={() => setReportModalOpen(true)}
          className="hover:underline flex items-center gap-1 text-[11px]"
        >
          <Flag className="w-3 h-3" />
          <span>Report page</span>
        </button>

        <Link href="/" className="hover:underline font-semibold inline-flex items-center gap-1">
          <span>✦ Create your own Biofolio</span>
        </Link>
      </footer>

      {/* Report Modal */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Report Portfolio</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitReport} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#14171A]">Reason for report</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full rounded-lg border border-[#E4DFDA] bg-white p-2.5 text-xs text-[#14171A] focus:outline-none"
              >
                <option value="Spam / Phishing">Spam / Phishing</option>
                <option value="Inappropriate Content">Inappropriate Content</option>
                <option value="Copyright Violation">Copyright Violation</option>
                <option value="Harassment / Hate Speech">Harassment / Hate Speech</option>
                <option value="Other">Other Violation</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#14171A]">Additional details (optional)</label>
              <textarea
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Explain why this content violates community guidelines..."
                className="w-full rounded-lg border border-[#E4DFDA] bg-white p-3 text-xs text-[#14171A] focus:outline-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setReportModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingReport} variant="destructive">
                {isSubmittingReport ? "Submitting..." : "Submit Report"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
