import { NextRequest, NextResponse } from 'next/server';
import { client, readOnlyClient } from '@/lib/sanity';

export const dynamic = 'force-dynamic';

type CommentFromQuery = {
  _id: string;
  author: {
    name: string;
    email: string;
  };
  content: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  parentComment?: string;
  post?: {
    _id: string;
    title: string;
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const postId = searchParams.get('postId');
    const status = searchParams.get('status') || 'approved';

    if (!postId) {
      return NextResponse.json({ error: 'Brak ID posta' }, { status: 400 });
    }


    // Pobierz komentarze dla danego posta (wszystkie statusy)
    const comments = await readOnlyClient.fetch(`
      *[_type == "comment" && post._ref == $postId] | order(createdAt asc) {
        _id,
        author,
        content,
        createdAt,
        status,
        parentComment,
        "post": post->{_id, title}
      }
    `, { postId });

    // Filtruj komentarze według statusu po pobraniu
    const filteredComments = (comments as CommentFromQuery[]).filter(
      (comment: CommentFromQuery) => comment.status === status
    );

    return NextResponse.json({ comments: filteredComments });
  } catch (error) {
    console.error('Błąd podczas pobierania komentarzy:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { author, content, postId, parentComment } = body;

    // Walidacja danych
    if (!author?.name || !author?.email || !content || !postId) {
      return NextResponse.json({ 
        error: 'Brak wymaganych pól: author.name, author.email, content, postId' 
      }, { status: 400 });
    }

    // Walidacja długości pól
    if (author.name.length < 2 || author.name.length > 100) {
      return NextResponse.json({ 
        error: 'Imię i nazwisko musi mieć od 2 do 100 znaków' 
      }, { status: 400 });
    }

    if (author.email.length > 255) {
      return NextResponse.json({ 
        error: 'Email jest za długi' 
      }, { status: 400 });
    }

    if (content.length < 10) {
      return NextResponse.json({ 
        error: 'Komentarz musi mieć przynajmniej 10 znaków' 
      }, { status: 400 });
    }

    // Walidacja email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(author.email)) {
      return NextResponse.json({ 
        error: 'Nieprawidłowy format email' 
      }, { status: 400 });
    }


    // Sprawdź czy post istnieje
    const post = await readOnlyClient.fetch(`*[_type == "post" && _id == $postId][0]`, { postId });
    if (!post) {
      return NextResponse.json({ error: 'Post nie istnieje' }, { status: 404 });
    }

    // Sprawdź ustawienia komentarzy dla posta
    const commentsEnabled = post.comments?.enabled !== false;
    const requireApproval = post.comments?.moderation?.requireApproval !== false;
    const allowReplies = post.comments?.moderation?.allowReplies !== false;

    if (!commentsEnabled) {
      return NextResponse.json({ error: 'Komentarze są wyłączone dla tego posta' }, { status: 403 });
    }

    // Jeśli to odpowiedź, sprawdź czy odpowiedzi są dozwolone
    if (parentComment && !allowReplies) {
      return NextResponse.json({ error: 'Odpowiedzi na komentarze są wyłączone' }, { status: 403 });
    }

    // Sprawdź długość komentarza
    const maxLength = post.comments?.moderation?.maxLength || 1000;
    if (content.length > maxLength) {
      return NextResponse.json({ 
        error: `Komentarz jest za długi. Maksymalnie ${maxLength} znaków.` 
      }, { status: 400 });
    }

    // Pobierz informacje o użytkowniku
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Sprawdź czy nie ma zbyt wielu komentarzy z tego samego IP w ostatnich 5 minutach
    const recentComments = await readOnlyClient.fetch(`
      count(*[_type == "comment" && ipAddress == $ipAddress && createdAt > $fiveMinutesAgo])
    `, { 
      ipAddress, 
      fiveMinutesAgo: new Date(Date.now() - 5 * 60 * 1000).toISOString() 
    });

    if (recentComments > 3) {
      return NextResponse.json({ 
        error: 'Zbyt wiele komentarzy w krótkim czasie. Spróbuj ponownie za kilka minut.' 
      }, { status: 429 });
    }

    // Sprawdź czy nie ma duplikatów komentarzy (ten sam content + IP w ostatnich 10 minutach)
    const duplicateComment = await readOnlyClient.fetch(`
      *[_type == "comment" && 
        ipAddress == $ipAddress && 
        content == $content && 
        createdAt > $tenMinutesAgo
      ][0]
    `, { 
      ipAddress, 
      content: content.trim(),
      tenMinutesAgo: new Date(Date.now() - 10 * 60 * 1000).toISOString() 
    });

    if (duplicateComment) {
      return NextResponse.json({ 
        error: 'Podobny komentarz został już dodany niedawno.' 
      }, { status: 400 });
    }

    // Utwórz komentarz
    const comment = {
      _type: 'comment',
      author: {
        name: author.name.trim(),
        email: author.email.trim(),
      },
      content: content.trim(),
      post: {
        _type: 'reference',
        _ref: postId,
      },
      parentComment: parentComment ? {
        _type: 'reference',
        _ref: parentComment,
      } : undefined,
      status: requireApproval ? 'pending' : 'approved',
      ipAddress,
      userAgent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await client.create(comment);

    return NextResponse.json({ 
      comment: result,
      message: requireApproval 
        ? 'Komentarz został dodany i oczekuje na zatwierdzenie' 
        : 'Komentarz został dodany pomyślnie'
    });

  } catch (error) {
    console.error('Błąd podczas dodawania komentarza:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
