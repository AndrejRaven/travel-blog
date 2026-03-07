import { NextRequest, NextResponse } from 'next/server';
import { createApiServerClient } from '@/lib/supabase/client';

/**
 * Obsługa OAuth callbacks z Supabase
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createApiServerClient(request);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/?error=auth_failed', requestUrl.origin));
    }
  }

  // Redirect do strony głównej po udanym logowaniu
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
