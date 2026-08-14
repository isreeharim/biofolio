import { z } from "zod";

export const ProfileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(50),
  headline: z.string().max(100).optional(),
  bio: z.string().max(200, "Bio cannot exceed 200 characters").optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export const ProjectSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Project title is required").max(80),
  subtitle: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
});

export const LinkSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Link title is required").max(60),
  url: z.string().url("Please enter a valid destination URL"),
  icon: z.string().max(10).default("↗"),
});

export const ThemeSchema = z.object({
  palette: z.enum(["cream", "lavender", "ink", "mint"]).default("cream"),
  font: z.enum(["serif", "sans", "mono"]).default("serif"),
  button: z.enum(["soft", "sharp", "outline"]).default("soft"),
});

export const SettingsSchema = z.object({
  slug: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-z0-9_-]+$/, "Only lowercase letters, numbers, hyphens and underscores are allowed"),
  isPublished: z.boolean().default(true),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
});

export const AuthOtpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3).max(30).optional(),
  displayName: z.string().min(2).optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export const AuthLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
