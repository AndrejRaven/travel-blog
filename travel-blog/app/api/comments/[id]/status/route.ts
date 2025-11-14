import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { requireAdmin } from '@/lib/auth';
import { verifyCsrfToken } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

export async function PATCH(
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
    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'approved', 'rejected', 'spam'].includes(status)) {
      return NextResponse.json({ 
        error: 'Nieprawidłowy status. Dozwolone: pending, approved, rejected, spam' 
      }, { status: 400 });
    }

    // Sprawdź czy komentarz istnieje
    const comment = await client.fetch(`*[_type == "comment" && _id == $id][0]`, { id });
    if (!comment) {
      return NextResponse.json({ error: 'Komentarz nie istnieje' }, { status: 404 });
    }

    // Aktualizuj status komentarza
    const updatedComment = await client
      .patch(id)
      .set({ 
        status,
        updatedAt: new Date().toISOString()
      })
      .commit();

    return NextResponse.json({ 
      comment: updatedComment,
      message: `Status komentarza został zmieniony na: ${status}`
    });

  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error('Błąd podczas aktualizacji statusu komentarza:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
