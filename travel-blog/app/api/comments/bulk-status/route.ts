import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { commentIds, status } = body;

    if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
      return NextResponse.json({ 
        error: 'Brak ID komentarzy do aktualizacji' 
      }, { status: 400 });
    }

    if (!status || !['pending', 'approved', 'rejected', 'spam'].includes(status)) {
      return NextResponse.json({ 
        error: 'Nieprawidłowy status. Dozwolone: pending, approved, rejected, spam' 
      }, { status: 400 });
    }

    // Sprawdź czy wszystkie komentarze istnieją
    const existingComments = await client.fetch(
      `*[_type == "comment" && _id in $commentIds]`, 
      { commentIds }
    );

    if (existingComments.length !== commentIds.length) {
      return NextResponse.json({ 
        error: 'Niektóre komentarze nie istnieją' 
      }, { status: 404 });
    }

    // Aktualizuj status wszystkich komentarzy
    await Promise.all(
      commentIds.map((id: string) =>
        client
          .patch(id)
          .set({
            status,
            updatedAt: new Date().toISOString()
          })
          .commit()
      )
    );

    return NextResponse.json({ 
      message: `Status ${commentIds.length} komentarzy został zmieniony na: ${status}`,
      updatedCount: commentIds.length
    });

  } catch (error) {
    console.error('Błąd podczas masowej aktualizacji statusu komentarzy:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
