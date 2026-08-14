"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { ProjectItem } from "@/lib/store/useBuilderStore";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<ProjectItem, "id">) => void;
  initialData?: ProjectItem | null;
}

export function ProjectModal({ isOpen, onClose, onSave, initialData }: ProjectModalProps) {
  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [tagsInput, setTagsInput] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);

  React.useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setSubtitle(initialData.subtitle || "");
      setDescription(initialData.description || "");
      setUrl(initialData.url || "");
      setImageUrl(initialData.imageUrl || "");
      setTagsInput(initialData.tags?.join(", ") || "");
    } else {
      setTitle("");
      setSubtitle("");
      setDescription("");
      setUrl("");
      setImageUrl("");
      setTagsInput("");
    }
  }, [initialData, isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "portfolio-media");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setImageUrl(data.url);
      toast.success("Project image uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please provide a project title");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      url: url.trim(),
      imageUrl: imageUrl.trim(),
      tags,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {initialData ? "Edit Project" : "Add Featured Project"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#14171A]">Project Title *</label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Biofolio Platform"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#14171A]">Role / Subtitle</label>
            <Input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Lead Designer · 2026"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#14171A]">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short summary of what you created and the impact it had..."
              className="w-full rounded-lg border border-[#E4DFDA] bg-white p-3 text-sm text-[#14171A] placeholder:text-[#918C95] focus-visible:outline-none focus-visible:border-[#6E5DCD] focus-visible:ring-2 focus-visible:ring-[#6E5DCD]/15"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#14171A]">Project URL</label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/project"
            />
          </div>

          {/* Thumbnail Uploader */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#14171A]">Project Thumbnail / Media</label>
            {imageUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-[#E4DFDA] h-28 bg-black/5 flex items-center justify-center">
                <img src={imageUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white p-1 rounded-full text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#E4DFDA] hover:border-[#6E5DCD] rounded-lg p-4 cursor-pointer transition-colors bg-[#FAF6F0]/50">
                <ImageIcon className="w-6 h-6 text-[#918C95] mb-1" />
                <span className="text-xs font-medium text-[#6E5DCD]">
                  {isUploading ? "Uploading media..." : "Upload thumbnail image"}
                </span>
                <span className="text-[10px] text-[#918C95]">PNG, JPG, WebP up to 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#14171A]">Tags (Comma separated)</label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Design, Next.js, Branding"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? "Save Changes" : "Add Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
