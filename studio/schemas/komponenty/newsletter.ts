export default {
  name: 'newsletter',
  type: 'object',
  title: 'Newsletter (Main)',
  fields: [
    {
      name: 'container',
      title: 'Kontener',
      type: 'baseContainer',
      description: 'Podstawowe ustawienia layoutu (szerokość, odstępy, wyrównanie, wysokość)',
      group: 'properties',
    },
    {
      name: 'title',
      title: 'Tytuł',
      type: 'string',
      initialValue: 'Zapisz się do newslettera',
      group: 'content',
    },
    {
      name: 'subtitle',
      title: 'Podtytuł',
      type: 'string',
      initialValue: 'Otrzymuj najnowsze artykuły prosto na swoją skrzynkę',
      group: 'content',
    },
    {
      name: 'description',
      title: 'Opis',
      type: 'text',
      rows: 3,
      initialValue: 'Bądź na bieżąco z naszymi podróżami, przepisami kulinarnymi i poradami podróżniczymi. Zapisz się do naszego newslettera i nie przegap żadnej przygody!',
      group: 'content',
    },
    {
      name: 'placeholder',
      title: 'Placeholder pola email',
      type: 'string',
      initialValue: 'Twój adres email',
      group: 'content',
    },
    {
      name: 'buttonText',
      title: 'Tekst przycisku',
      type: 'string',
      initialValue: 'Zapisz się',
      group: 'content',
    },
    {
      name: 'successMessage',
      title: 'Wiadomość sukcesu',
      type: 'string',
      initialValue: 'Dziękujemy za zapisanie się do newslettera!',
      group: 'content',
    },
    {
      name: 'errorMessage',
      title: 'Wiadomość błędu',
      type: 'string',
      initialValue: 'Wystąpił błąd. Spróbuj ponownie.',
      group: 'content',
    },
    {
      name: 'privacyText',
      title: 'Tekst o prywatności',
      type: 'text',
      rows: 2,
      initialValue: 'Twoje dane są bezpieczne. Nie spamujemy i możesz się wypisać w każdej chwili.',
      group: 'content',
    },
    {
      name: 'showBackground',
      title: 'Pokaż tło',
      type: 'boolean',
      initialValue: true,
      description: 'Czy sekcja ma mieć kolorowe tło',
      group: 'content',
    },
    {
      name: 'features',
      title: 'Funkcje/cechy',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'icon',
              title: 'Ikona',
              type: 'string',
              options: {
                list: [
                  { title: 'Shield (Bezpieczne dane)', value: 'Shield' },
                  { title: 'UserX (Zrezygnujesz kiedy chcesz)', value: 'UserX' },
                  { title: 'Ban (Zero spamu)', value: 'Ban' },
                ],
                layout: 'radio',
              },
              initialValue: 'Shield',
            },
            {
              name: 'text',
              title: 'Tekst',
              type: 'string',
              initialValue: 'Bezpieczne dane',
            },
          ],
          preview: {
            select: {
              title: 'text',
              subtitle: 'icon',
            },
            prepare(selection: any) {
              const { title, subtitle } = selection;
              return {
                title: title || 'Funkcja',
                subtitle: `Ikona: ${subtitle || 'Shield'}`,
              };
            },
          },
        },
      ],
      initialValue: [
        { icon: 'Shield', text: 'Bezpieczne dane' },
        { icon: 'UserX', text: 'Zrezygnujesz kiedy chcesz' },
        { icon: 'Ban', text: 'Zero spamu' },
      ],
      group: 'content',
    },
    // Stan: Sukces (świeżo zapisany)
    {
      name: 'successTitle',
      title: 'Tytuł sukcesu',
      type: 'string',
      initialValue: 'Dzięki za zapis!',
      group: 'success',
    },
    {
      name: 'successSubtitle',
      title: 'Podtytuł sukcesu',
      type: 'string',
      initialValue: 'Sprawdź skrzynkę — wysłaliśmy potwierdzenie. Kliknij link w emailu, aby dokończyć zapis.',
      group: 'success',
    },
    {
      name: 'successInfo',
      title: 'Informacja dodatkowa (sukces)',
      type: 'string',
      initialValue: 'Nie widzisz emaila? Sprawdź folder SPAM lub zaczekaj kilka minut.',
      group: 'success',
    },
    {
      name: 'unsubscribeButtonText',
      title: 'Tekst przycisku "Wypisz się"',
      type: 'string',
      initialValue: 'Wypisz się',
      group: 'success',
    },
    // Stan: Już zapisany
    {
      name: 'alreadySubscribedTitle',
      title: 'Tytuł (już zapisany)',
      type: 'string',
      initialValue: 'Cześć, wygląda na to, że jesteś już z nami!',
      group: 'alreadySubscribed',
    },
    {
      name: 'alreadySubscribedConfirmed',
      title: 'Tekst (potwierdzone)',
      type: 'string',
      initialValue: 'Twój email {{email}} jest zapisany. Dziękujemy za zaufanie!',
      group: 'alreadySubscribed',
    },
    {
      name: 'alreadySubscribedPending',
      title: 'Tekst (oczekuje potwierdzenia)',
      type: 'string',
      initialValue: 'Twój email {{email}} czeka na potwierdzenie. Sprawdź skrzynkę!',
      group: 'alreadySubscribed',
    },
    // Stan: Po wypisaniu
    {
      name: 'unsubscribedTitle',
      title: 'Tytuł (wypisany)',
      type: 'string',
      initialValue: 'Szkoda, że odchodzisz',
      group: 'unsubscribed',
    },
    {
      name: 'unsubscribedSubtitle',
      title: 'Podtytuł (wypisany)',
      type: 'string',
      initialValue: 'Wypisaliśmy Cię z newslettera. Możesz wrócić w każdej chwili — zawsze będziesz mile widziana/y!',
      group: 'unsubscribed',
    },
    {
      name: 'unsubscribedInfo',
      title: 'Informacja dodatkowa (wypisany)',
      type: 'string',
      initialValue: 'Jeśli chcesz nam pomóc być lepszymi, napisz co możemy poprawić.',
      group: 'unsubscribed',
    },
    {
      name: 'resubscribeButtonText',
      title: 'Tekst przycisku "Zapisz się ponownie"',
      type: 'string',
      initialValue: 'Zmień zdanie? Zapisz się ponownie',
      group: 'unsubscribed',
    },
    // Błędy walidacji
    {
      name: 'errorInvalidEmail',
      title: 'Błąd: nieprawidłowy email',
      type: 'string',
      initialValue: 'To nie wygląda jak prawidłowy email. Sprawdź pisownię.',
      group: 'errors',
    },
    {
      name: 'errorEmailExists',
      title: 'Błąd: email już zapisany',
      type: 'string',
      initialValue: 'Ten email jest już zapisany. Sprawdź swoją skrzynkę!',
      group: 'errors',
    },
    {
      name: 'errorNetworkIssue',
      title: 'Błąd: problem z połączeniem',
      type: 'string',
      initialValue: 'Ups, problem z połączeniem. Spróbuj ponownie.',
      group: 'errors',
    },
    {
      name: 'errorUnknown',
      title: 'Błąd: nieznany',
      type: 'string',
      initialValue: 'Coś poszło nie tak. Spróbuj za chwilę.',
      group: 'errors',
    },
    // Rate limiting
    {
      name: 'rateLimitMessage',
      title: 'Komunikat rate limit',
      type: 'string',
      initialValue: 'Poczekaj chwilkę... Za dużo akcji.',
      group: 'rateLimit',
    },
    {
      name: 'rateLimitWait',
      title: 'Komunikat oczekiwania',
      type: 'string',
      initialValue: 'Odczekaj {{seconds}} sekund',
      group: 'rateLimit',
    },
  ],
  groups: [
    {
      name: 'content',
      title: 'Treść',
      default: true,
    },
    {
      name: 'properties',
      title: 'Właściwości',
    },
    {
      name: 'success',
      title: 'Sukces',
    },
    {
      name: 'alreadySubscribed',
      title: 'Już zapisany',
    },
    {
      name: 'unsubscribed',
      title: 'Wypisany',
    },
    {
      name: 'errors',
      title: 'Błędy',
    },
    {
      name: 'rateLimit',
      title: 'Rate limit',
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle',
    },
    prepare(selection: any) {
      const { title, subtitle } = selection;
      return {
        title: title || 'Newsletter',
        subtitle: subtitle || 'Brak podtytułu',
      };
    },
  },
}
