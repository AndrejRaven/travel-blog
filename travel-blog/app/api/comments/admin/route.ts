import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Weryfikacja uprawnień admin
    await requireAdmin();

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
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error('Błąd podczas pobierania komentarzy:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
