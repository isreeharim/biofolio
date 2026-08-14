"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LinkItem } from "@/lib/store/useBuilderStore";
import { toast } from "sonner";

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (link: Omit<LinkItem, "id">) => void;
  initialData?: LinkItem | null;
}

export function LinkModal({ isOpen, onClose, onSave, initialData }: LinkModalProps) {
  const [title, setTitle] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [icon, setIcon] = React.useState("↗");

  React.useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setUrl(initialData.url || "");
      setIcon(initialData.icon || "↗");
    } else {
      setTitle("");
      setUrl("");
      setIcon("↗");
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a link title");
      return;
    }
    if (!url.trim()) {
      toast.error("Please enter a destination URL");
      return;
    }

    onSave({
      title: title.trim(),
      url: url.trim(),
      icon: icon.trim() || "↗",
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {initialData ? "Edit Link" : "Add Custom Link"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#14171A]">Link Title *</label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My GitHub Profile"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#14171A]">Destination URL *</label>
            <Input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/yourname"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#14171A]">Icon / Symbol</label>
            <div className="flex gap-2">
              {["↗", "◎", "◫", "in", "▶", "✉", "✦"].map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => setIcon(sym)}
                  className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all ${
                    icon === sym
                      ? "bg-[#6E5DCD] text-white border-[#6E5DCD]"
                      : "bg-[#FAF6F0] text-[#14171A] border-[#E4DFDA] hover:bg-white"
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? "Save Link" : "Add Link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
