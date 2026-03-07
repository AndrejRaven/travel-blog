import { NextRequest, NextResponse } from 'next/server';
import { getMailerLiteConfig, findSubscriberByEmail } from '@/lib/mailerlite';

export const dynamic = 'force-dynamic';

/**
 * Sprawdza czy użytkownik ma Premium:
 * - Gdy MAILERLITE_PREMIUM_GROUP_ID jest ustawione: premium = użytkownik jest w tej grupie.
 * - Gdy nie: premium = użytkownik jest aktywnym subskrybentem newslettera (status active).
 * POST /api/premium/check
 * Body: { email: string }
 * Response: { isPremium: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email jest wymagany.' },
        { status: 400 }
      );
    }

    const config = getMailerLiteConfig();
    if (!config) {
      return NextResponse.json(
        { success: false, message: 'Brak konfiguracji MailerLite.' },
        { status: 500 }
      );
    }

    const subscriber = await findSubscriberByEmail(email, config);
    if (!subscriber) {
      return NextResponse.json({
        success: true,
        isPremium: false,
      });
    }

    const premiumGroupId = process.env.MAILERLITE_PREMIUM_GROUP_ID;
    const isPremium = premiumGroupId
      ? (subscriber.groups?.includes(premiumGroupId) ?? false)
      : subscriber.status === 'active';

    return NextResponse.json({
      success: true,
      isPremium,
    });
  } catch (error) {
    console.error('Error checking premium status:', error);
    
    // Jeśli błąd połączenia (DNS, timeout), zwróć false zamiast błędu
    // To pozwoli aplikacji działać offline
    if (error instanceof Error && (
      error.message.includes('ENOTFOUND') || 
      error.message.includes('getaddrinfo') ||
      error.message.includes('timeout') ||
      error.message.includes('Timeout')
    )) {
      console.warn('[PremiumCheck] Connection error, returning false (offline mode)');
      return NextResponse.json({
        success: true,
        isPremium: false, // Bezpieczne założenie - nie premium jeśli nie można sprawdzić
      });
    }
    
    return NextResponse.json(
      { success: false, message: 'Błąd podczas sprawdzania statusu premium.' },
      { status: 500 }
    );
  }
}
