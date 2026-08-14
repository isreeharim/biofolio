import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#111827]">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 bg-[#1F2937] text-white px-4 sm:px-6 h-16 flex items-center justify-between border-b border-[#374151]">
        <div className="flex items-center gap-3">
          <span className="text-xl">🛡️</span>
          <div>
            <h1 className="font-bold text-sm leading-tight">Biofolio Admin Center</h1>
            <p className="text-[10px] text-gray-400 font-mono">Platform Governance &amp; Moderation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-700 text-xs gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Studio</span>
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm" className="text-xs border-gray-600 bg-transparent text-white hover:bg-gray-700">
              Public Site
            </Button>
          </Link>
        </div>
      </header>

      {/* Admin Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
