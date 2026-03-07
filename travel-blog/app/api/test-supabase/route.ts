import { NextResponse } from 'next/server';
import { createAdminServerClient } from '@/lib/supabase/client';

export async function GET() {
    try {
        const supabase = createAdminServerClient();

        // Test połączenia - sprawdź czy możemy się połączyć
        const { data, error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);

        if (error) {
            // Jeśli tabela nie istnieje, to OK - to znaczy że połączenie działa
            if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                return NextResponse.json({
                    success: true,
                    message: '✅ Supabase connection successful! Tables not created yet.',
                    note: 'Run the SQL schema in Supabase Dashboard to create tables.',
                });
            }

            return NextResponse.json(
                {
                    success: false,
                    error: error.message,
                    code: error.code,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: '✅ Supabase connection successful!',
            data,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                details: error instanceof Error ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}