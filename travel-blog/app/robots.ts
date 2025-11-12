import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_CONFIG.url;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/admin/',
          '/api/comments/admin/',
          '/api/draft/',
        ],
      },
      // Facebook crawlers - wymagane dla Open Graph
      {
        userAgent: 'facebookexternalhit',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/admin/',
          '/api/comments/admin/',
          '/api/draft/',
        ],
      },
      {
        userAgent: 'Facebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/admin/',
          '/api/comments/admin/',
          '/api/draft/',
        ],
      },
      // OpenAI GPTBot
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/admin/',
          '/api/comments/admin/',
          '/api/draft/',
        ],
      },
      // Google AI (Gemini)
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/admin/',
          '/api/comments/admin/',
          '/api/draft/',
        ],
      },
      // ChatGPT User Agent
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/admin/',
          '/api/comments/admin/',
          '/api/draft/',
        ],
      },
      // Anthropic Claude
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/admin/',
          '/api/comments/admin/',
          '/api/draft/',
        ],
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/admin/',
          '/api/comments/admin/',
          '/api/draft/',
        ],
      },
      // Common Crawl
      {
        userAgent: 'CCBot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/admin/',
          '/api/comments/admin/',
          '/api/draft/',
        ],
      },
      // Perplexity
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/admin/',
          '/api/comments/admin/',
          '/api/draft/',
        ],
      },
      // Bytedance (TikTok)
      {
        userAgent: 'Bytespider',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/admin/',
          '/api/comments/admin/',
          '/api/draft/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

