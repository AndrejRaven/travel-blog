import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { requireAdmin } from '@/lib/auth';
import { verifyCsrfToken } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Weryfikacja uprawnień admin
    await requireAdmin();

    // Weryfikuj CSRF token
    if (!(await verifyCsrfToken(request))) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const { id } = await params;

    // Sprawdź czy komentarz istnieje
    const comment = await client.fetch(`*[_type == "comment" && _id == $id][0]`, { id });
    if (!comment) {
      return NextResponse.json({ error: 'Komentarz nie istnieje' }, { status: 404 });
    }

    // Usuń komentarz
    await client.delete(id);

    return NextResponse.json({ 
      message: 'Komentarz został usunięty pomyślnie'
    });

  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error('Błąd podczas usuwania komentarza:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
