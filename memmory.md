# Biofolio Project Memory

## Product Intent & V1 Loop

Biofolio is a free, no-code personal website builder. Its V1 loop is:

**Build → Customize → Publish → Share**

---

## 🛠️ Full-Stack Technology Stack (Version 1.0)

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS + Custom HSL Design Tokens
- **UI Components**: shadcn/ui + Radix UI + Lucide React
- **Motion & Interactions**: Framer Motion
- **Drag & Drop Builder**: `@dnd-kit/core` + `@dnd-kit/sortable`
- **Client State**: Zustand (with undo/redo history and device viewport modes)
- **Forms & Validation**: React Hook Form + Zod
- **Backend & Database**: Supabase PostgreSQL + Supabase Auth + Supabase Storage (`@supabase/ssr`)
- **Hosting & CI/CD**: Vercel + GitHub

---

## 🗂️ App Router Architecture

```
app/
├── (marketing)/
│   ├── page.tsx                    # Landing Page with Hero Handle Checker & Interactive Theme Switcher
│   └── layout.tsx                  # Marketing layout with Navbar & Footer
├── (auth)/
│   ├── login/page.tsx              # Fast Password Sign-In & Password Reset
│   ├── signup/page.tsx             # 6-Digit Email OTP Verification Flow
│   └── layout.tsx                  # Centered Auth Card Layout
├── dashboard/
│   ├── page.tsx                    # Creator Studio Builder (dnd-kit reordering, look customizer, analytics)
│   ├── components/                 # DevicePreview, ProjectModal, LinkModal, SortableItem
│   └── layout.tsx                  # Studio topbar with undo/redo & publish status
├── admin/
│   ├── page.tsx                    # Admin Control Center (User mgmt, Moderation, Content Reports)
│   └── layout.tsx                  # Gated Admin Layout
├── [username]/
│   ├── page.tsx                    # Ultra-fast SSR Public Portfolio with Dynamic SEO Metadata
│   ├── PublicPageClient.tsx        # Client click & view tracker, share button, report modal
│   └── not-found.tsx               # 404 handler for unclaimed handles
├── api/
│   ├── analytics/route.ts          # Event logging for views & clicks
│   └── upload/route.ts             # Validated media uploads to Supabase Storage
├── globals.css                     # Design tokens & theme classes
└── layout.tsx                      # Root layout with Google Fonts (Playfair, DM Sans, DM Mono) & Toaster
```

---

## 🔑 Backend & Supabase Configuration

- **Project ID**: `zzdoibodjjltkbqrdlzn`
- **Project URL**: `https://zzdoibodjjltkbqrdlzn.supabase.co`
- **Storage Buckets**: `avatars` (5MB), `portfolio-media` (10MB)
- **Admin Account**:
  - **Email**: `isreeharim@gmail.com`
  - **Password**: `812940`
  - **Role**: `admin` in `public.profiles`

---

## 🔄 Developer Workflow & Rules

- **Continuous Git Sync**: Always stage, commit with descriptive messages, and push all modifications to GitHub `origin/agent/biofolio-v1` automatically after any code edits or feature additions.

---

## 🚀 Running Locally

```powershell
# Development server
npm run dev

# Production build test
npm run build
npm run start
```
