import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Biofolio — The Free Personal Website & Portfolio Builder",
    template: "%s | Biofolio",
  },
  description:
    "Build a gorgeous, interactive portfolio and link-in-bio in 5 minutes. Live theme previews, drag-and-drop projects, rich analytics, and zero code.",
  metadataBase: new URL("https://biofolio.sreeharim.site"),
  openGraph: {
    title: "Biofolio — Your corner of the internet, beautifully made.",
    description:
      "Claim your personal link: biofolio.site/yourname. 100% free no-code portfolio builder.",
    url: "https://biofolio.sreeharim.site",
    siteName: "Biofolio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Biofolio — The Free Personal Website Builder",
    description:
      "Claim your personal link: biofolio.site/yourname. 100% free no-code portfolio builder.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body className="font-sans antialiased bg-[#FAF6F0] text-[#14171A]">
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
