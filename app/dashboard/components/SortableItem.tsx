"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit2, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SortableItem({ id, children, onEdit, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex items-center justify-between gap-3 p-3.5 bg-white border border-[#E4DFDA] hover:border-[#6E5DCD]/40 rounded-xl shadow-xs transition-all"
    >
      {/* Drag Grip Handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-[#918C95] hover:text-[#14171A] p-1 -ml-1 touch-none"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">{children}</div>

      {/* Item Action Controls */}
      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8 text-[#6B6572] hover:text-[#6E5DCD]"
            title="Edit item"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
        )}
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-[#6B6572] hover:text-red-600"
            title="Delete item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
