import { NextResponse } from "next/server";
import { getLatestYouTubeVideo } from "@/lib/youtube";

export const revalidate = 300;

export async function GET() {
  try {
    const latestVideo = await getLatestYouTubeVideo();

    if (!latestVideo) {
      return NextResponse.json(
        { error: "No video data available" },
        { status: 503 }
      );
    }

    return NextResponse.json(latestVideo, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("❌ Error fetching YouTube data:", error);
    return NextResponse.json(
      { error: "Failed to fetch YouTube data" },
      { status: 500 }
    );
  }
}
