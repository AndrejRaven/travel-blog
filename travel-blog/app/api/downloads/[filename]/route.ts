import { NextRequest, NextResponse } from "next/server";
import { readOnlyClient } from "@/lib/sanity";

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // Next.js 15 wymaga Promise dla params
    const resolvedParams = await params;
    const fileIdOrName = decodeURIComponent(resolvedParams.filename);

    if (!fileIdOrName) {
      return NextResponse.json(
        { error: "ID lub nazwa pliku jest wymagana" },
        { status: 400 }
      );
    }

    // Spróbuj najpierw znaleźć po _id (jeśli to ID), potem po originalFilename
    // sanity-plugin-media używa typu "sanity.fileAsset", ale sprawdzamy też inne warianty
    const query = `*[(_type == "sanity.fileAsset" || _type == "fileAsset") && (_id == $fileIdOrName || originalFilename == $fileIdOrName)][0]{
      _id,
      url,
      originalFilename,
      mimeType,
      size
    }`;

    const file = await readOnlyClient.fetch(query, { fileIdOrName });

    if (!file || !file.url) {
      return NextResponse.json(
        { error: "Plik nie został znaleziony" },
        { status: 404 }
      );
    }

    // Pobierz plik z Sanity CDN
    const fileResponse = await fetch(file.url);

    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: "Nie udało się pobrać pliku" },
        { status: 500 }
      );
    }

    // Pobierz zawartość pliku
    const fileBuffer = await fileResponse.arrayBuffer();

    // Użyj originalFilename z Sanity (zawsze powinno być dostępne po znalezieniu pliku)
    const downloadFilename = file.originalFilename || fileIdOrName;

    // Funkcja do kodowania nazwy pliku dla nagłówka Content-Disposition (RFC 5987)
    const encodeFilename = (filename: string) => {
      // Dla prostych nazw użyj standardowego formatu
      // Dla nazw z polskimi znakami użyj RFC 5987
      if (/[^\x20-\x7E]/.test(filename)) {
        // Zawiera znaki spoza ASCII - użyj RFC 5987
        const encoded = encodeURIComponent(filename);
        return `attachment; filename="${filename.replace(/"/g, '\\"')}"; filename*=UTF-8''${encoded}`;
      }
      // Tylko ASCII - użyj prostego formatu
      return `attachment; filename="${filename.replace(/"/g, '\\"')}"`;
    };

    // Zwróć plik z odpowiednimi headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": encodeFilename(downloadFilename),
        "Content-Length": file.size?.toString() || fileBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Błąd podczas pobierania pliku:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania pliku" },
      { status: 500 }
    );
  }
}

