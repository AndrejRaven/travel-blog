import { createClient } from '@supabase/supabase-js';
import { createBrowserClient as createSSRBrowserClient, createServerClient as createSSRServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables. ' +
        'Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
}

// Helper function do sprawdzania czy jesteśmy w przeglądarce
const isBrowser = typeof window !== 'undefined';

// Client dla użycia w komponentach klienckich – createBrowserClient zapisuje sesję w cookies,
// dzięki czemu Route Handlers (createServerClient) widzą użytkownika i nie zwracają 401.
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
    if (!isBrowser) {
        throw new Error('Supabase client can only be used in browser');
    }

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            'Missing Supabase environment variables. ' +
            'Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
        );
    }

    if (!supabaseInstance) {
        supabaseInstance = createSSRBrowserClient(supabaseUrl, supabaseAnonKey);

        if (typeof window !== 'undefined') {
            window.addEventListener('unhandledrejection', (event) => {
                const error = event.reason;
                if (error && typeof error === 'object') {
                    // Ignoruj tylko klasyczne AbortError / „signal is aborted” (np. przy cancelu fetchy),
                    // ale NIE ukrywaj błędów z locks.js ani innych problemów Supabase.
                    if (
                        error.name === 'AbortError' ||
                        error.message?.includes('signal is aborted')
                    ) {
                        event.preventDefault();
                        console.debug('[Supabase] Ignored AbortError:', error.message);
                        return;
                    }
                }
            });
        }
    }

    return supabaseInstance;
}

export const supabase = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        return getSupabaseClient()[prop as keyof SupabaseClient];
    },
});

// Client dla użycia po stronie serwera (z cookies dla sesji użytkownika)
export async function createServerClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            'Missing Supabase environment variables. ' +
            'Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
        );
    }

    // Import cookies tylko po stronie serwera
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();

    return createSSRServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                } catch (error) {
                    // Ignoruj błędy podczas ustawiania cookies (np. podczas redirect)
                }
            },
        },
    });
}

// Client dla użycia w API routes (z cookies z NextRequest)
export function createApiServerClient(request: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            'Missing Supabase environment variables. ' +
            'Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
        );
    }

    // Pobierz cookies z request
    const cookieHeader = request.headers.get('cookie') || '';

    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
        },
        global: {
            headers: {
                Cookie: cookieHeader,
            },
        },
    });
}

// Client dla użycia po stronie serwera z service role key (tylko dla operacji admin)
export function createAdminServerClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error(
            'Missing Supabase environment variables. ' +
            'Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
        );
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}