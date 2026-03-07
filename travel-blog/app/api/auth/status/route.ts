import { NextRequest, NextResponse } from 'next/server';
import { createApiServerClient } from '@/lib/supabase/client';

/**
 * Endpoint do sprawdzania statusu autentykacji
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createApiServerClient(request);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
        },
        { status: 200 }
      );
    }

    // Pobierz profil użytkownika
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, subscription_tier, subscription_status')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || null,
        subscription_tier: profile?.subscription_tier || 'free',
        subscription_status: profile?.subscription_status || 'active',
      },
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
