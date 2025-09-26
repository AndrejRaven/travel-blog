import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    console.error('Błąd podczas aktualizacji statusu komentarza:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
