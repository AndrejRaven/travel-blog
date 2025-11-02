import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity';

export async function GET() {
  try {
    // Pobierz wszystkie komentarze z informacjami o postach
    const comments = await client.fetch(`
      *[_type == "comment"] | order(createdAt desc) {
        _id,
        author,
        content,
        createdAt,
        status,
        parentComment,
        ipAddress,
        userAgent,
        "post": post->{_id, title}
      }
    `);

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Błąd podczas pobierania komentarzy:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
