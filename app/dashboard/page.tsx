"use client";

import * as React from "react";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { 
  Layers, 
  Palette, 
  Settings, 
  BarChart3, 
  Plus, 
  Upload, 
  Save, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Image as ImageIcon,
  MousePointerClick,
  Eye,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useBuilderStore, ProjectItem, LinkItem } from "@/lib/store/useBuilderStore";
import { SortableItem } from "./components/SortableItem";
import { ProjectModal } from "./components/ProjectModal";
import { LinkModal } from "./components/LinkModal";
import { DevicePreview } from "./components/DevicePreview";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function DashboardPage() {
  const {
    portfolioId,
    profile,
    theme,
    projects,
    links,
    slug,
    isPublished,
    setProfile,
    setTheme,
    setSlug,
    setIsPublished,
    addProject,
    updateProject,
    deleteProject,
    reorderProjects,
    addLink,
    updateLink,
    deleteLink,
    reorderLinks,
    markSaved,
    isDirty,
  } = useBuilderStore();

  // Modals state
  const [projectModalOpen, setProjectModalOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<ProjectItem | null>(null);

  const [linkModalOpen, setLinkModalOpen] = React.useState(false);
  const [editingLink, setEditingLink] = React.useState<LinkItem | null>(null);

  const [isSavingCloud, setIsSavingCloud] = React.useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);

  // Analytics state
  const [analyticsData, setAnalyticsData] = React.useState<{
    views: number;
    clicks: number;
    ctr: string;
    topLinks: { title: string; clicks: number }[];
  }>({
    views: 0,
    clicks: 0,
    ctr: "0%",
    topLinks: [],
  });

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch real analytics when portfolioId changes
  React.useEffect(() => {
    async function loadAnalytics() {
      if (!portfolioId) return;
      try {
        const supabase = createClient();
        const { data: events } = await supabase
          .from("analytics_events")
          .select("*")
          .eq("portfolio_id", portfolioId);

        if (events) {
          const views = events.filter((e) => e.event_type === "page_view").length;
          const clicks = events.filter((e) => e.event_type === "link_click").length;
          const ctr = views > 0 ? `${((clicks / views) * 100).toFixed(1)}%` : "0%";

          setAnalyticsData({
            views,
            clicks,
            ctr,
            topLinks: [],
          });
        }
      } catch (err) {
        console.warn("Analytics query note:", err);
      }
    }
    loadAnalytics();
  }, [portfolioId]);

  // Handle Project drag end
  const handleProjectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((p) => p.id === active.id);
      const newIndex = projects.findIndex((p) => p.id === over.id);
      reorderProjects(arrayMove(projects, oldIndex, newIndex));
    }
  };

  // Handle Link drag end
  const handleLinkDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((l) => l.id === active.id);
      const newIndex = links.findIndex((l) => l.id === over.id);
      reorderLinks(arrayMove(links, oldIndex, newIndex));
    }
  };

  // Avatar Uploader
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "avatars");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setProfile({ avatarUrl: data.url });
      toast.success("Profile photo updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload profile picture");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Save All Changes to Supabase
  const handleSaveToCloud = async () => {
    try {
      setIsSavingCloud(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Please log in to save changes.");

      // 1. Update Profile
      await supabase
        .from("profiles")
        .update({
          display_name: profile.displayName,
          headline: profile.headline,
          bio: profile.bio,
          avatar_url: profile.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      // 2. Update Portfolio
      let currentPortfolioId = portfolioId;
      if (!currentPortfolioId) {
        const { data: p } = await supabase
          .from("portfolios")
          .select("id")
          .eq("user_id", user.id)
          .single();
        currentPortfolioId = p?.id;
      }

      if (currentPortfolioId) {
        await supabase
          .from("portfolios")
          .update({
            slug: slug.toLowerCase().trim(),
            theme: theme,
            is_published: isPublished,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentPortfolioId);

        // Fetch or create sections
        const { data: sections } = await supabase
          .from("portfolio_sections")
          .select("id, section_type")
          .eq("portfolio_id", currentPortfolioId);

        let linksSecId = sections?.find((s) => s.section_type === "links")?.id;
        let projectsSecId = sections?.find((s) => s.section_type === "projects")?.id;

        if (!linksSecId) {
          const { data: newSec } = await supabase
            .from("portfolio_sections")
            .insert({ portfolio_id: currentPortfolioId, section_type: "links", title: "Links", sort_order: 0 })
            .select("id")
            .single();
          linksSecId = newSec?.id;
        }

        if (!projectsSecId) {
          const { data: newSec } = await supabase
            .from("portfolio_sections")
            .insert({ portfolio_id: currentPortfolioId, section_type: "projects", title: "Featured Projects", sort_order: 1 })
            .select("id")
            .single();
          projectsSecId = newSec?.id;
        }

        // Sync items
        if (linksSecId) {
          await supabase.from("portfolio_items").delete().eq("section_id", linksSecId);
          if (links.length > 0) {
            await supabase.from("portfolio_items").insert(
              links.map((l, idx) => ({
                section_id: linksSecId,
                title: l.title,
                url: l.url,
                icon: l.icon || "↗",
                sort_order: idx,
              }))
            );
          }
        }

        if (projectsSecId) {
          await supabase.from("portfolio_items").delete().eq("section_id", projectsSecId);
          if (projects.length > 0) {
            await supabase.from("portfolio_items").insert(
              projects.map((p, idx) => ({
                section_id: projectsSecId,
                title: p.title,
                subtitle: p.subtitle,
                description: p.description,
                url: p.url,
                image_url: p.imageUrl,
                tags: p.tags,
                sort_order: idx,
              }))
            );
          }
        }
      }

      markSaved();
      toast.success("Portfolio published & saved to cloud!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save changes");
    } finally {
      setIsSavingCloud(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Left Column: Creator Studio Controls (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Studio Action Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#E4DFDA] shadow-xs">
          <div>
            <h1 className="font-serif font-bold text-xl text-[#14171A]">Creator Studio</h1>
            <p className="text-xs text-[#6B6572]">
              Changes update your preview instantly. Click save when ready.
            </p>
          </div>
          <Button
            onClick={handleSaveToCloud}
            disabled={isSavingCloud}
            className="rounded-full shadow-xs gap-1.5"
          >
            {isSavingCloud ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save &amp; Publish</span>
              </>
            )}
          </Button>
        </div>

        {/* Main Tab Controls */}
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid grid-cols-4 w-full h-12 bg-white border border-[#E4DFDA] p-1 rounded-2xl shadow-xs">
            <TabsTrigger value="content" className="rounded-xl gap-1.5 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Content</span>
            </TabsTrigger>
            <TabsTrigger value="design" className="rounded-xl gap-1.5 text-xs font-semibold">
              <Palette className="w-3.5 h-3.5" />
              <span>Design</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl gap-1.5 text-xs font-semibold">
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl gap-1.5 text-xs font-semibold">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* 1. CONTENT TAB */}
          <TabsContent value="content" className="space-y-6 pt-4">
            
            {/* Profile Information Card */}
            <Card className="border-[#E4DFDA] rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif">Profile Information</CardTitle>
                <CardDescription className="text-xs">
                  Your identity, headline, and bio shown at the top of your portfolio.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Avatar Uploader Row */}
                <div className="flex items-center gap-4">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.displayName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#E4DFDA] shadow-xs"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#EDE9FE] text-[#6E5DCD] flex items-center justify-center text-xl font-bold font-serif shadow-xs">
                      {profile.displayName ? profile.displayName[0].toUpperCase() : "✦"}
                    </div>
                  )}

                  <div>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4DFDA] bg-white text-xs font-semibold text-[#14171A] hover:bg-[#FAF6F0] cursor-pointer transition-colors shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-[#6E5DCD]" />
                      <span>{isUploadingAvatar ? "Uploading photo..." : "Upload Profile Picture"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={isUploadingAvatar}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-[#918C95] mt-1">Recommended: Square JPG/PNG, up to 5MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#14171A]">Display Name</label>
                    <Input
                      value={profile.displayName}
                      onChange={(e) => setProfile({ displayName: e.target.value })}
                      placeholder="Amelia Parker"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#14171A]">Role / Headline</label>
                    <Input
                      value={profile.headline}
                      onChange={(e) => setProfile({ headline: e.target.value })}
                      placeholder="Product Designer &amp; Illustrator"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#14171A]">Bio / Summary</label>
                  <textarea
                    rows={3}
                    value={profile.bio}
                    onChange={(e) => setProfile({ bio: e.target.value })}
                    placeholder="Tell visitors a little about yourself and what you're working on..."
                    className="w-full rounded-lg border border-[#E4DFDA] bg-white p-3 text-sm text-[#14171A] placeholder:text-[#918C95] focus-visible:outline-none focus-visible:border-[#6E5DCD] focus-visible:ring-2 focus-visible:ring-[#6E5DCD]/15"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Featured Projects Card (with dnd-kit drag and drop) */}
            <Card className="border-[#E4DFDA] rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-serif">Featured Projects</CardTitle>
                  <CardDescription className="text-xs">
                    Drag items to reorder how they appear on your live site.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingProject(null);
                    setProjectModalOpen(true);
                  }}
                  className="rounded-full gap-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </Button>
              </CardHeader>
              <CardContent>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleProjectDragEnd}
                >
                  <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2.5">
                      {projects.map((project) => (
                        <SortableItem
                          key={project.id}
                          id={project.id}
                          onEdit={() => {
                            setEditingProject(project);
                            setProjectModalOpen(true);
                          }}
                          onDelete={() => deleteProject(project.id)}
                        >
                          <div className="flex items-center gap-3">
                            {project.imageUrl && (
                              <img
                                src={project.imageUrl}
                                alt={project.title}
                                className="w-10 h-10 rounded-lg object-cover border border-[#E4DFDA]"
                              />
                            )}
                            <div>
                              <p className="font-semibold text-sm leading-tight text-[#14171A]">{project.title}</p>
                              {project.subtitle && (
                                <p className="text-xs text-[#6B6572] mt-0.5">{project.subtitle}</p>
                              )}
                            </div>
                          </div>
                        </SortableItem>
                      ))}

                      {projects.length === 0 && (
                        <div className="text-center py-8 border-2 border-dashed border-[#E4DFDA] rounded-xl text-xs text-[#918C95]">
                          No projects added yet. Click &quot;Add Project&quot; above.
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>

            {/* Custom Links Card (with dnd-kit drag and drop) */}
            <Card className="border-[#E4DFDA] rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-serif">Links &amp; Socials</CardTitle>
                  <CardDescription className="text-xs">
                    Add buttons to case studies, social profiles, and articles.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingLink(null);
                    setLinkModalOpen(true);
                  }}
                  className="rounded-full gap-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Link</span>
                </Button>
              </CardHeader>
              <CardContent>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleLinkDragEnd}
                >
                  <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2.5">
                      {links.map((link) => (
                        <SortableItem
                          key={link.id}
                          id={link.id}
                          onEdit={() => {
                            setEditingLink(link);
                            setLinkModalOpen(true);
                          }}
                          onDelete={() => deleteLink(link.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-[#FAF6F0] flex items-center justify-center text-xs font-mono font-bold">
                              {link.icon || "↗"}
                            </span>
                            <div className="truncate">
                              <p className="font-semibold text-sm text-[#14171A] truncate">{link.title}</p>
                              <p className="text-xs text-[#6B6572] truncate">{link.url}</p>
                            </div>
                          </div>
                        </SortableItem>
                      ))}

                      {links.length === 0 && (
                        <div className="text-center py-8 border-2 border-dashed border-[#E4DFDA] rounded-xl text-xs text-[#918C95]">
                          No links added yet. Click &quot;Add Link&quot; above.
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>

          </TabsContent>

          {/* 2. DESIGN & LOOK TAB */}
          <TabsContent value="design" className="space-y-6 pt-4">
            <Card className="border-[#E4DFDA] rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base font-serif">Palette &amp; Color System</CardTitle>
                <CardDescription className="text-xs">
                  Pick from curated harmonious color themes tailored for high contrast and readability.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: "cream", name: "Warm Cream", bg: "#FAF6F0", border: "#E4DFDA", text: "#14171A" },
                    { id: "lavender", name: "Soft Lavender", bg: "#F4F1FA", border: "#DED8EB", text: "#191426" },
                    { id: "ink", name: "Modern Ink", bg: "#14171A", border: "#2D333B", text: "#FFFFFF" },
                    { id: "mint", name: "Fresh Mint", bg: "#F0F7F4", border: "#D2E4DC", text: "#12261E" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setTheme({ palette: p.id as any })}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                        theme.palette === p.id
                          ? "border-[#6E5DCD] shadow-sm scale-102"
                          : "border-[#E4DFDA] hover:border-[#6E5DCD]/50"
                      }`}
                      style={{ backgroundColor: p.bg }}
                    >
                      <div className="w-5 h-5 rounded-full mb-2 shadow-xs" style={{ backgroundColor: p.border }} />
                      <p className="text-xs font-bold" style={{ color: p.text }}>{p.name}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#E4DFDA] rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base font-serif">Typography Style</CardTitle>
                <CardDescription className="text-xs">
                  Configure the primary typeface for your titles and headlines.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "serif", label: "Editorial Serif", sample: "Playfair" },
                    { id: "sans", label: "Modern Sans", sample: "DM Sans" },
                    { id: "mono", label: "Technical Mono", sample: "DM Mono" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setTheme({ font: f.id as any })}
                      className={`p-4 rounded-xl border-2 text-center transition-all bg-white ${
                        theme.font === f.id
                          ? "border-[#6E5DCD] shadow-sm font-semibold"
                          : "border-[#E4DFDA] hover:border-[#6E5DCD]/50"
                      }`}
                    >
                      <p className="text-lg mb-1 font-serif">{f.sample}</p>
                      <p className="text-xs text-[#6B6572]">{f.label}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#E4DFDA] rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base font-serif">Button Shape &amp; Corners</CardTitle>
                <CardDescription className="text-xs">
                  Choose the radius and tactile feel for your link buttons.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "soft", label: "Pill / Soft", rounded: "rounded-full" },
                    { id: "sharp", label: "Sharp / Box", rounded: "rounded-md" },
                    { id: "outline", label: "Outline", rounded: "rounded-full border-2" },
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setTheme({ button: b.id as any })}
                      className={`p-4 rounded-xl border-2 text-center transition-all bg-white ${
                        theme.button === b.id
                          ? "border-[#6E5DCD] shadow-sm font-semibold"
                          : "border-[#E4DFDA] hover:border-[#6E5DCD]/50"
                      }`}
                    >
                      <div className={`w-full py-1.5 bg-[#FAF6F0] border border-[#E4DFDA] text-xs font-semibold mb-2 ${b.rounded}`}>
                        Button
                      </div>
                      <p className="text-xs text-[#6B6572]">{b.label}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-6 pt-4">
            <Card className="border-[#E4DFDA] rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base font-serif">Public Handle &amp; URL</CardTitle>
                <CardDescription className="text-xs">
                  Your custom Biofolio address. You can update this at any time.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#14171A]">Address</label>
                  <div className="flex items-center border border-[#E4DFDA] rounded-lg bg-white overflow-hidden focus-within:border-[#6E5DCD] focus-within:ring-2 focus-within:ring-[#6E5DCD]/15">
                    <span className="bg-[#FAF6F0] px-3 py-2 text-xs font-mono text-[#918C95] border-r border-[#E4DFDA] select-none">
                      biofolio.site/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                      className="w-full px-3 py-2 text-sm text-[#14171A] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E4DFDA]">
                  <div>
                    <p className="text-xs font-semibold text-[#14171A]">Public Visibility</p>
                    <p className="text-[11px] text-[#6B6572]">Allow anyone on the internet to visit your page.</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isPublished ? "default" : "outline"}
                    onClick={() => setIsPublished(!isPublished)}
                    className="rounded-full text-xs"
                  >
                    {isPublished ? "Visible (Published)" : "Hidden (Draft)"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-6 pt-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-[#E4DFDA] rounded-2xl p-4 bg-white">
                <div className="flex items-center gap-2 text-xs text-[#6B6572] mb-1">
                  <Eye className="w-3.5 h-3.5 text-[#6E5DCD]" />
                  <span>Page Views</span>
                </div>
                <p className="text-2xl font-bold font-serif">{analyticsData.views}</p>
              </Card>

              <Card className="border-[#E4DFDA] rounded-2xl p-4 bg-white">
                <div className="flex items-center gap-2 text-xs text-[#6B6572] mb-1">
                  <MousePointerClick className="w-3.5 h-3.5 text-[#6E5DCD]" />
                  <span>Link Clicks</span>
                </div>
                <p className="text-2xl font-bold font-serif">{analyticsData.clicks}</p>
              </Card>

              <Card className="border-[#E4DFDA] rounded-2xl p-4 bg-white">
                <div className="flex items-center gap-2 text-xs text-[#6B6572] mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-[#6E5DCD]" />
                  <span>CTR</span>
                </div>
                <p className="text-2xl font-bold font-serif">{analyticsData.ctr}</p>
              </Card>
            </div>

            <Card className="border-[#E4DFDA] rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base font-serif">Privacy-First Insights</CardTitle>
                <CardDescription className="text-xs">
                  Biofolio does not store cookies or personal identifiers on your visitors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[#6B6572] leading-relaxed">
                  Analytics events are aggregated directly from your live public portfolio page. Share your link to start collecting views and clicks!
                </p>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

      </div>

      {/* Right Column: Live Interactive Device Preview (5 cols) */}
      <div className="lg:col-span-5 sticky top-20 h-[calc(100vh-6rem)]">
        <DevicePreview />
      </div>

      {/* Modals */}
      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        initialData={editingProject}
        onSave={(projData) => {
          if (editingProject) {
            updateProject(editingProject.id, projData);
          } else {
            addProject(projData);
          }
        }}
      />

      <LinkModal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        initialData={editingLink}
        onSave={(linkData) => {
          if (editingLink) {
            updateLink(editingLink.id, linkData);
          } else {
            addLink(linkData);
          }
        }}
      />

    </div>
  );
}
