import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name = ""): string {
  if (!name) return "BF";
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "BF";
}

export function cleanUsername(username: string): string {
  return username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
}

export function formatUrl(url: string): string {
  if (!url) return "#";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:")) {
    return url;
  }
  return `https://${url}`;
}
