/**
 * Funkcje pomocnicze do pobierania statystyk dla dashboardu admin
 */

import { fetchGroq, Post } from "./sanity";
import { QUERIES } from "./queries";
import { getMailerLiteConfig } from "./mailerlite";
import { client } from "./sanity";

export interface CommentStats {
  pending: number;
  approved: number;
  rejected: number;
  spam: number;
  total: number;
}

export interface NewsletterStats {
  total: number;
  active: number;
  error?: string;
}

export interface PostStats {
  total: number;
  recent: Post[];
  error?: string;
}

export interface AdminStats {
  comments: CommentStats;
  newsletter: NewsletterStats;
  posts: PostStats;
}

/**
 * Pobiera statystyki komentarzy z Sanity
 */
export async function getCommentsStats(): Promise<CommentStats> {
  try {
    const comments = await client.fetch(`
      *[_type == "comment"] {
        status
      }
    `);

    const stats: CommentStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      spam: 0,
      total: comments.length,
    };

    comments.forEach((comment: { status?: string }) => {
      const status = comment.status?.toLowerCase() || "pending";
      switch (status) {
        case "approved":
          stats.approved++;
          break;
        case "rejected":
          stats.rejected++;
          break;
        case "spam":
          stats.spam++;
          break;
        default:
          stats.pending++;
      }
    });

    return stats;
  } catch (error) {
    console.error("Error fetching comments stats:", error);
    return {
      pending: 0,
      approved: 0,
      rejected: 0,
      spam: 0,
      total: 0,
    };
  }
}

/**
 * Pobiera statystyki newslettera z MailerLite
 */
export async function getNewsletterStats(): Promise<NewsletterStats> {
  const config = getMailerLiteConfig();
  
  if (!config) {
    return {
      total: 0,
      active: 0,
      error: "MailerLite nie jest skonfigurowany",
    };
  }

  try {
    let total = 0;
    let active = 0;
    let nextUrl: string | null = `https://connect.mailerlite.com/api/groups/${encodeURIComponent(config.groupId)}/subscribers?limit=100`;

    // Iteruj przez wszystkich subskrybentów z paginacją
    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          break;
        }
        throw new Error(`MailerLite API error: ${response.status}`);
      }

      const data = await response.json();
      const subscribers: Array<{ status?: string }> = Array.isArray(data?.data)
        ? data.data
        : [];

      subscribers.forEach((subscriber) => {
        total++;
        if (subscriber.status?.toLowerCase() === "active") {
          active++;
        }
      });

      // Sprawdź paginację
      const nextLink = data?.links?.next;
      const nextCursor = data?.meta?.next_cursor;

      if (typeof nextLink === "string" && nextLink) {
        nextUrl = nextLink;
      } else if (typeof nextCursor === "string" && nextCursor) {
        nextUrl = `https://connect.mailerlite.com/api/groups/${encodeURIComponent(
          config.groupId
        )}/subscribers?limit=100&cursor=${encodeURIComponent(nextCursor)}`;
      } else {
        nextUrl = null;
      }
    }

    return {
      total,
      active,
    };
  } catch (error) {
    console.error("Error fetching newsletter stats:", error);
    return {
      total: 0,
      active: 0,
      error: error instanceof Error ? error.message : "Błąd pobierania danych",
    };
  }
}

/**
 * Pobiera statystyki postów z Sanity
 */
export async function getPostsStats(): Promise<PostStats> {
  try {
    const [total, recent] = await Promise.all([
      fetchGroq<number>(QUERIES.POST.ALL_COUNT, {}, "POSTS"),
      fetchGroq<Post[]>(QUERIES.POST.RECENT, {}, "POSTS"),
    ]);

    return {
      total,
      recent,
    };
  } catch (error) {
    console.error("Error fetching posts stats:", error);
    return {
      total: 0,
      recent: [],
      error: error instanceof Error ? error.message : "Błąd pobierania danych",
    };
  }
}

/**
 * Pobiera wszystkie statystyki dla dashboardu
 */
export async function getAllStats(): Promise<AdminStats> {
  const [comments, newsletter, posts] = await Promise.all([
    getCommentsStats(),
    getNewsletterStats(),
    getPostsStats(),
  ]);

  return {
    comments,
    newsletter,
    posts,
  };
}

