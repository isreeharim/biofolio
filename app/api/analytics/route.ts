import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { portfolioId, eventType, itemId, path } = body;

    if (!portfolioId || !eventType) {
      return NextResponse.json({ error: "Missing required analytics fields" }, { status: 400 });
    }

    const supabase = await createClient();
    const referrer = req.headers.get("referer") || "direct";
    const userAgent = req.headers.get("user-agent") || "";
    const isMobile = /mobile/i.test(userAgent);
    const deviceType = isMobile ? "mobile" : "desktop";

    const { error } = await supabase.from("analytics_events").insert({
      portfolio_id: portfolioId,
      event_type: eventType,
      item_id: itemId || null,
      referrer: referrer,
      device_type: deviceType,
      metadata: { path: path || "/", userAgent: userAgent.slice(0, 100) },
    });

    if (error) {
      console.warn("Analytics insert warning:", error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to log event" }, { status: 500 });
  }
}
