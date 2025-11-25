import { SITE_CONFIG } from "@/lib/config";
import { buildAbsoluteUrl } from "@/lib/metadata";
import { QUERIES } from "@/lib/queries";
import { fetchGroq, getSiteConfig, type Post } from "@/lib/sanity";
import { getPostUrl } from "@/lib/utils";

const RSS_LIMIT = 50;
export const revalidate = 600; // 10 minutes

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, "");

export async function GET() {
  const [siteConfig, posts] = await Promise.all([
    getSiteConfig(),
    fetchGroq<Post[]>(QUERIES.POST.ALL, {}, "POSTS"),
  ]);

  const channelTitle =
    siteConfig?.general?.siteName?.trim() || SITE_CONFIG.name;
  const channelDescription =
    siteConfig?.general?.siteDescription?.trim() || SITE_CONFIG.description;
  const channelLink = buildAbsoluteUrl("/");

  const feedItems = posts
    .filter((post) => post.slug?.current && !post.seo?.noIndex)
    .slice(0, RSS_LIMIT)
    .flatMap((post) => {
      const path = getPostUrl(post);
      if (path === "#") {
        return [];
      }

      const absoluteUrl = buildAbsoluteUrl(path);
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt)
        : new Date();
      const description =
        post.description || post.subtitle || "Nowy artykuł na blogu";

      return [
        `    <item>
      <title>${escapeXml(post.title ?? "Bez tytułu")}</title>
      <link>${absoluteUrl}</link>
      <guid>${absoluteUrl}</guid>
      <pubDate>${pubDate.toUTCString()}</pubDate>
      <description>${escapeXml(stripHtml(description))}</description>
    </item>`,
      ];
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${channelLink}</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>pl-PL</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${feedItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=600",
    },
  });
}

