import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProjectItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  tags: string[];
}

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export interface PortfolioProfile {
  displayName: string;
  headline: string;
  bio: string;
  avatarUrl: string;
}

export interface PortfolioTheme {
  palette: "cream" | "lavender" | "ink" | "mint";
  font: "serif" | "sans" | "mono";
  button: "soft" | "sharp" | "outline";
}

export interface BuilderStateSnapshot {
  profile: PortfolioProfile;
  theme: PortfolioTheme;
  projects: ProjectItem[];
  links: LinkItem[];
  slug: string;
  isPublished: boolean;
}

interface BuilderStore extends BuilderStateSnapshot {
  portfolioId: string | null;
  deviceMode: "mobile" | "tablet" | "desktop";
  selectedSection: string;
  isSaving: boolean;
  isDirty: boolean;
  past: BuilderStateSnapshot[];
  future: BuilderStateSnapshot[];

  // Actions
  setProfile: (profile: Partial<PortfolioProfile>) => void;
  setTheme: (theme: Partial<PortfolioTheme>) => void;
  setSlug: (slug: string) => void;
  setIsPublished: (isPublished: boolean) => void;
  setDeviceMode: (mode: "mobile" | "tablet" | "desktop") => void;
  setSelectedSection: (section: string) => void;
  
  // Projects CRUD
  addProject: (project: Omit<ProjectItem, "id">) => void;
  updateProject: (id: string, project: Partial<ProjectItem>) => void;
  deleteProject: (id: string) => void;
  reorderProjects: (newOrder: ProjectItem[]) => void;

  // Links CRUD
  addLink: (link: Omit<LinkItem, "id">) => void;
  updateLink: (id: string, link: Partial<LinkItem>) => void;
  deleteLink: (id: string) => void;
  reorderLinks: (newOrder: LinkItem[]) => void;

  // History Actions
  undo: () => void;
  redo: () => void;
  hydrateState: (snapshot: Partial<BuilderStateSnapshot> & { portfolioId?: string }) => void;
  markSaved: () => void;
}

const defaultSnapshot: BuilderStateSnapshot = {
  profile: {
    displayName: "Amelia Parker",
    headline: "Product designer & illustrator",
    bio: "Designing thoughtful digital experiences with a soft spot for bold ideas, good type, and a perfectly brewed flat white.",
    avatarUrl: "",
  },
  theme: {
    palette: "cream",
    font: "serif",
    button: "soft",
  },
  projects: [
    {
      id: "proj-1",
      title: "Biofolio Site Builder",
      subtitle: "No-code portfolio builder · 2026",
      description: "Built a lightning-fast portfolio generator with live previews, curated aesthetics, and real-time custom styling.",
      url: "https://biofolio.site",
      imageUrl: "",
      tags: ["Web", "UI/UX", "SaaS"],
    },
    {
      id: "proj-2",
      title: "Minimal Design System",
      subtitle: "Open-source UI Kit",
      description: "A collection of tactile, accessible interface components built with modern CSS tokens and zero dependencies.",
      url: "https://example.com/design-system",
      imageUrl: "",
      tags: ["Figma", "CSS", "Open Source"],
    },
  ],
  links: [
    { id: "link-1", title: "Selected Case Studies", url: "https://example.com/work", icon: "◫" },
    { id: "link-2", title: "Design Work on Instagram", url: "https://instagram.com/amelia", icon: "◎" },
    { id: "link-3", title: "Connect on LinkedIn", url: "https://linkedin.com/in/ameliaparker", icon: "in" },
  ],
  slug: "amelia",
  isPublished: true,
};

function recordSnapshot(state: BuilderStore): BuilderStateSnapshot {
  return {
    profile: { ...state.profile },
    theme: { ...state.theme },
    projects: [...state.projects],
    links: [...state.links],
    slug: state.slug,
    isPublished: state.isPublished,
  };
}

export const useBuilderStore = create<BuilderStore>()(
  persist(
    (set, get) => ({
      ...defaultSnapshot,
      portfolioId: null,
      deviceMode: "mobile",
      selectedSection: "content",
      isSaving: false,
      isDirty: false,
      past: [],
      future: [],

      setProfile: (updates) => {
        const current = recordSnapshot(get());
        set((state) => ({
          past: [...state.past.slice(-20), current],
          future: [],
          profile: { ...state.profile, ...updates },
          isDirty: true,
        }));
      },

      setTheme: (updates) => {
        const current = recordSnapshot(get());
        set((state) => ({
          past: [...state.past.slice(-20), current],
          future: [],
          theme: { ...state.theme, ...updates },
          isDirty: true,
        }));
      },

      setSlug: (slug) => {
        set({ slug, isDirty: true });
      },

      setIsPublished: (isPublished) => {
        set({ isPublished, isDirty: true });
      },

      setDeviceMode: (deviceMode) => {
        set({ deviceMode });
      },

      setSelectedSection: (selectedSection) => {
        set({ selectedSection });
      },

      addProject: (projectData) => {
        const current = recordSnapshot(get());
        const newProject: ProjectItem = {
          ...projectData,
          id: `proj-${Date.now()}`,
        };
        set((state) => ({
          past: [...state.past.slice(-20), current],
          future: [],
          projects: [...state.projects, newProject],
          isDirty: true,
        }));
      },

      updateProject: (id, updates) => {
        const current = recordSnapshot(get());
        set((state) => ({
          past: [...state.past.slice(-20), current],
          future: [],
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
          isDirty: true,
        }));
      },

      deleteProject: (id) => {
        const current = recordSnapshot(get());
        set((state) => ({
          past: [...state.past.slice(-20), current],
          future: [],
          projects: state.projects.filter((p) => p.id !== id),
          isDirty: true,
        }));
      },

      reorderProjects: (newOrder) => {
        const current = recordSnapshot(get());
        set((state) => ({
          past: [...state.past.slice(-20), current],
          future: [],
          projects: newOrder,
          isDirty: true,
        }));
      },

      addLink: (linkData) => {
        const current = recordSnapshot(get());
        const newLink: LinkItem = {
          ...linkData,
          id: `link-${Date.now()}`,
        };
        set((state) => ({
          past: [...state.past.slice(-20), current],
          future: [],
          links: [...state.links, newLink],
          isDirty: true,
        }));
      },

      updateLink: (id, updates) => {
        const current = recordSnapshot(get());
        set((state) => ({
          past: [...state.past.slice(-20), current],
          future: [],
          links: state.links.map((l) => (l.id === id ? { ...l, ...updates } : l)),
          isDirty: true,
        }));
      },

      deleteLink: (id) => {
        const current = recordSnapshot(get());
        set((state) => ({
          past: [...state.past.slice(-20), current],
          future: [],
          links: state.links.filter((l) => l.id !== id),
          isDirty: true,
        }));
      },

      reorderLinks: (newOrder) => {
        const current = recordSnapshot(get());
        set((state) => ({
          past: [...state.past.slice(-20), current],
          future: [],
          links: newOrder,
          isDirty: true,
        }));
      },

      undo: () => {
        const { past, future } = get();
        if (past.length === 0) return;

        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        const current = recordSnapshot(get());

        set({
          ...previous,
          past: newPast,
          future: [current, ...future],
          isDirty: true,
        });
      },

      redo: () => {
        const { past, future } = get();
        if (future.length === 0) return;

        const next = future[0];
        const newFuture = future.slice(1);
        const current = recordSnapshot(get());

        set({
          ...next,
          past: [...past, current],
          future: newFuture,
          isDirty: true,
        });
      },

      hydrateState: (snapshot) => {
        set((state) => ({
          ...state,
          ...snapshot,
          past: [],
          future: [],
          isDirty: false,
        }));
      },

      markSaved: () => {
        set({ isDirty: false, isSaving: false });
      },
    }),
    {
      name: "biofolio-builder-storage",
      partialize: (state) => ({
        profile: state.profile,
        theme: state.theme,
        projects: state.projects,
        links: state.links,
        slug: state.slug,
        isPublished: state.isPublished,
      }),
    }
  )
);
