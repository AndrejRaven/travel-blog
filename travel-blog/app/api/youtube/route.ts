import { NextResponse } from 'next/server';

const YOUTUBE_CHANNEL_ID = "UCUUm2vkbs-W7KulrJZIpNDA";
const YOUTUBE_RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;

export async function GET() {
  try {
    
    const response = await fetch(YOUTUBE_RSS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BlogBot/1.0)',
      },
    });

    if (!response.ok) {
      console.error('❌ YouTube RSS fetch failed:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();

    return new NextResponse(xmlText, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('❌ Error fetching YouTube RSS:', error);
    return NextResponse.json(
      { error: 'Failed to fetch YouTube data' },
      { status: 500 }
    );
  }
}
