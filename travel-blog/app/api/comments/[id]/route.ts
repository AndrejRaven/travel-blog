import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    console.error('Błąd podczas usuwania komentarza:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
