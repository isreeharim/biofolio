import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold font-serif">
          <span className="text-[#6E5DCD] text-3xl font-sans">✦</span>
          <span>biofolio</span>
        </Link>
      </div>

      {/* Centered Auth Card Container */}
      <div className="w-full max-w-md">
        {children}
      </div>

      {/* Footer Return Link */}
      <div className="mt-8 text-center text-xs text-[#6B6572]">
        <Link href="/" className="hover:underline">
          ← Back to Biofolio Home
        </Link>
      </div>
    </div>
  );
}
