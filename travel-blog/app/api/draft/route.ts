import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')

  // Sprawdź secret token
  if (secret !== process.env.SANITY_DRAFT_SECRET) {
    return new Response('Invalid token', { status: 401 })
  }

  // Włącz draft mode
  (await draftMode()).enable() 

  // Przekieruj do odpowiedniej strony
  if (slug) {
    redirect(`/post/${slug}`)
  } else {
    redirect('/')
  }
}