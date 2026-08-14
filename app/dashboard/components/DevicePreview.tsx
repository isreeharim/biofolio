"use client";

import * as React from "react";
import { useBuilderStore } from "@/lib/store/useBuilderStore";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Tablet, Monitor, ExternalLink, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getInitials } from "@/lib/utils";

export function DevicePreview() {
  const {
    profile,
    theme,
    projects,
    links,
    slug,
    deviceMode,
    setDeviceMode,
  } = useBuilderStore();

  const themeClass = `theme-${theme.palette}`;
  const fontClass = `font-${theme.font}`;
  const buttonClass = `button-${theme.button}`;

  return (
    <div className="flex flex-col items-center h-full">
      {/* Top Device Viewport Controls */}
      <div className="flex items-center justify-between w-full max-w-md px-4 py-2 mb-3 bg-white border border-[#E4DFDA] rounded-full shadow-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDeviceMode("mobile")}
            className={`p-1.5 rounded-full transition-all ${
              deviceMode === "mobile"
                ? "bg-[#6E5DCD] text-white shadow-xs"
                : "text-[#6B6572] hover:text-[#14171A]"
            }`}
            title="Mobile View"
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceMode("tablet")}
            className={`p-1.5 rounded-full transition-all ${
              deviceMode === "tablet"
                ? "bg-[#6E5DCD] text-white shadow-xs"
                : "text-[#6B6572] hover:text-[#14171A]"
            }`}
            title="Tablet View"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceMode("desktop")}
            className={`p-1.5 rounded-full transition-all ${
              deviceMode === "desktop"
                ? "bg-[#6E5DCD] text-white shadow-xs"
                : "text-[#6B6572] hover:text-[#14171A]"
            }`}
            title="Desktop View"
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>

        <a
          href={`/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-[#6E5DCD] hover:underline flex items-center gap-1 font-semibold"
        >
          <span>biofolio.site/{slug}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Frame Container */}
      <div className="w-full flex-1 overflow-y-auto flex justify-center p-2">
        <motion.div
          layout
          className={`transition-all duration-300 shadow-xl overflow-hidden ${
            deviceMode === "mobile"
              ? "w-[360px] rounded-[40px] border-[6px] border-[#14171A] p-4 min-h-[640px]"
              : deviceMode === "tablet"
              ? "w-[540px] rounded-[28px] border-[4px] border-[#14171A] p-6 min-h-[640px]"
              : "w-full max-w-xl rounded-2xl border border-[#E4DFDA] p-8 min-h-[600px]"
          }`}
          style={{
            backgroundColor: "var(--portfolio-bg)",
            color: "var(--portfolio-text)",
          }}
        >
          {/* Inner Phone Notch if mobile */}
          {deviceMode === "mobile" && (
            <div className="flex justify-center mb-4">
              <div className="w-24 h-4 bg-black/15 rounded-full" />
            </div>
          )}

          {/* Public Profile View Layout */}
          <div className={`${themeClass} ${fontClass} ${buttonClass} space-y-6`}>
            
            {/* Header Profile Section */}
            <div className="text-center space-y-3">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-tr from-[#6E5DCD] to-[#A78BFA] text-white flex items-center justify-center text-2xl font-bold font-serif shadow-md">
                  {getInitials(profile.displayName)}
                </div>
              )}

              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {profile.displayName || "Your Name"}
                </h1>
                {profile.headline && (
                  <p className="text-xs text-[#6B6572] font-medium mt-0.5">
                    {profile.headline}
                  </p>
                )}
              </div>

              {profile.bio && (
                <p className="text-xs text-[#6B6572] leading-relaxed max-w-xs mx-auto">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Featured Projects Section */}
            {projects.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B6572] text-center">
                  Featured Work
                </h2>
                <div className="space-y-3">
                  {projects.map((project) => (
                    <a
                      key={project.id}
                      href={project.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 rounded-xl border border-[#E4DFDA] bg-white text-[#14171A] hover:border-[#6E5DCD] shadow-xs transition-all"
                    >
                      {project.imageUrl && (
                        <div className="rounded-lg overflow-hidden h-32 mb-3 bg-black/5">
                          <img
                            src={project.imageUrl}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-sm">{project.title}</h3>
                          {project.subtitle && (
                            <p className="text-[11px] text-[#6B6572] font-medium mt-0.5">
                              {project.subtitle}
                            </p>
                          )}
                        </div>
                        {project.url && <span className="text-xs opacity-70">↗</span>}
                      </div>

                      {project.description && (
                        <p className="text-xs text-[#6B6572] mt-1.5 leading-relaxed">
                          {project.description}
                        </p>
                      )}

                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {project.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[9px] py-0 px-2 font-normal">
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
              <div className="space-y-2 pt-2">
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="theme-button-style flex items-center justify-between p-3.5 border border-[#E4DFDA] bg-white text-[#14171A] hover:border-[#6E5DCD] text-sm font-medium transition-all shadow-xs"
                  >
                    <span className="truncate">{link.title}</span>
                    <span className="font-mono text-xs opacity-75">{link.icon || "↗"}</span>
                  </a>
                ))}
              </div>
            )}

            {/* Brand Watermark */}
            <div className="text-center pt-4">
              <span className="text-[10px] font-medium text-[#6B6572] inline-flex items-center gap-1 opacity-75">
                <span>✦ Built with</span>
                <span className="font-serif font-bold text-[#14171A]">Biofolio</span>
              </span>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
