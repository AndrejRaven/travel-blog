/**
 * MailerLite API helper functions
 * Provides optimized functions for working with MailerLite API
 */

export interface MailerLiteSubscriber {
  id: string;
  email: string;
  status: 'active' | 'unconfirmed' | 'unsubscribed' | 'bounced' | 'junk';
  groups?: string[];
  [key: string]: unknown;
}

export interface MailerLiteConfig {
  token: string;
  groupId: string;
}

/**
 * Gets MailerLite configuration from environment variables
 */
export function getMailerLiteConfig(): MailerLiteConfig | null {
  const token = process.env.MAILERLITE_TOKEN;
  const groupId = process.env.MAILERLITE_GROUP_ID;

  if (!token || !groupId) {
    return null;
  }

  return { token, groupId };
}

/**
 * Finds a subscriber by email using MailerLite API
 * Tries multiple approaches for maximum compatibility
 */
export async function findSubscriberByEmail(
  email: string,
  config?: MailerLiteConfig
): Promise<MailerLiteSubscriber | null> {
  const mlConfig = config || getMailerLiteConfig();
  if (!mlConfig) {
    throw new Error('MailerLite configuration not found');
  }

  try {
    // Try filter[email] approach first
    const url = `https://connect.mailerlite.com/api/subscribers?filter[email]=${encodeURIComponent(email)}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${mlConfig.token}`,
        Accept: 'application/json',
      },
    });

    // If filter[email] doesn't work, try searching through group with pagination
    if (!response.ok && response.status !== 404) {
      // Fallback: search through group subscribers
      return await findSubscriberInGroupByEmail(email, mlConfig);
    }

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.message || `MailerLite API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if we have matching subscriber
    const subscribers: MailerLiteSubscriber[] = Array.isArray(data?.data) ? data.data : [];
    
    // Find exact email match (case-insensitive)
    const subscriber = subscribers.find(
      (sub) => sub?.email?.toLowerCase() === email.toLowerCase()
    );

    if (subscriber) {
      return subscriber;
    }

    // If not found with filter, try group search as fallback
    return await findSubscriberInGroupByEmail(email, mlConfig);
  } catch (error) {
    // If direct search fails, try group search as fallback
    try {
      return await findSubscriberInGroupByEmail(email, mlConfig || getMailerLiteConfig()!);
    } catch (fallbackError) {
      throw error; // Throw original error
    }
  }
}

/**
 * Finds subscriber by searching through group subscribers
 * Fallback method when direct filter doesn't work
 */
async function findSubscriberInGroupByEmail(
  email: string,
  config: MailerLiteConfig
): Promise<MailerLiteSubscriber | null> {
  let nextUrl: string | null = `https://connect.mailerlite.com/api/groups/${encodeURIComponent(config.groupId)}/subscribers?limit=100`;
  const emailLower = email.toLowerCase();

  while (nextUrl) {
    const response: Response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.message || `MailerLite API error: ${response.status}`);
    }

    const data = await response.json();
    const subscribers: MailerLiteSubscriber[] = Array.isArray(data?.data) ? data.data : [];
    
    // Find exact email match
    const subscriber = subscribers.find(
      (sub) => sub?.email?.toLowerCase() === emailLower
    );

    if (subscriber) {
      return subscriber;
    }

    // Check for pagination
    const nextLink = data?.links?.next;
    const nextCursor = data?.meta?.next_cursor;
    
    if (typeof nextLink === "string" && nextLink) {
      nextUrl = nextLink;
    } else if (typeof nextCursor === "string" && nextCursor) {
      nextUrl = `https://connect.mailerlite.com/api/groups/${encodeURIComponent(config.groupId)}/subscribers?limit=100&cursor=${encodeURIComponent(nextCursor)}`;
    } else {
      nextUrl = null;
    }
  }

  return null;
}

/**
 * Finds a subscriber in a specific group by email
 * Uses group search first for better reliability
 */
export async function findSubscriberInGroup(
  email: string,
  config?: MailerLiteConfig
): Promise<MailerLiteSubscriber | null> {
  const mlConfig = config || getMailerLiteConfig();
  if (!mlConfig) {
    throw new Error('MailerLite configuration not found');
  }

  try {
    // Search directly in group - more reliable since we know they're in the group
    const subscriber = await findSubscriberInGroupByEmail(email, mlConfig);
    return subscriber;
  } catch (error) {
    // If group search fails, try general search and verify group membership
    try {
      const subscriber = await findSubscriberByEmail(email, mlConfig);
      if (!subscriber) {
        return null;
      }

      // If groups info is available, check membership
      if (subscriber.groups && Array.isArray(subscriber.groups)) {
        if (subscriber.groups.includes(mlConfig.groupId)) {
          return subscriber;
        }
        return null;
      }

      // If groups info not available, verify by checking group directly
      // This is a double-check to ensure subscriber is in the group
      const groupSubscriber = await findSubscriberInGroupByEmail(email, mlConfig);
      return groupSubscriber;
    } catch (fallbackError) {
      throw error; // Throw original error
    }
  }
}

