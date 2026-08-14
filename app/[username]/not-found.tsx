import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PortfolioNotFound() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-6 text-center">
      <span className="text-[#6E5DCD] text-4xl mb-2 font-sans">✦</span>
      <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#14171A] mb-2">
        Portfolio Not Found
      </h1>
      <p className="text-sm text-[#6B6572] max-w-sm mb-6 leading-relaxed">
        This Biofolio address is either unclaimed or currently unpublished by its creator.
      </p>
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="outline" className="rounded-full text-xs">
            ← Home
          </Button>
        </Link>
        <Link href="/signup">
          <Button className="rounded-full text-xs">
            Claim this Handle
          </Button>
        </Link>
      </div>
    </div>
  );
}
