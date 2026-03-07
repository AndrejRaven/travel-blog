import { NextRequest, NextResponse } from 'next/server';
import { createApiServerClient, createAdminServerClient } from '@/lib/supabase/client';

/**
 * API route do usuwania konta użytkownika
 * Wymaga service role key do usunięcia z auth.users
 */
export async function DELETE(request: NextRequest) {
  try {
    // Najpierw sprawdź autentykację użytkownika z cookies
    const supabase = createApiServerClient(request);
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Usuń konto z auth.users (wymaga service role key)
    const adminSupabase = createAdminServerClient();
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('Error deleting user account:', deleteError);
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete account' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete-account route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
