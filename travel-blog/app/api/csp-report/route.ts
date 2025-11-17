import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: unknown = null;

    if (
      contentType.includes("application/json") ||
      contentType.includes("application/csp-report") ||
      contentType.includes("application/reports+json")
    ) {
      body = await request.json().catch(() => null);
    } else {
      body = await request.text();
    }

    logger.warn("CSP violation reported", {
      path: request.nextUrl.pathname,
      method: request.method,
      body,
    });
  } catch (error) {
    logger.error("Failed to process CSP report", error);
  }

  return NextResponse.json({ received: true });
}

export function GET() {
  return NextResponse.json({ status: "ready" });
}

export function HEAD() {
  return new NextResponse(null, { status: 204 });
}

