import baseContainer from "../shared/baseContainer";

export default {
  name: 'newsletter',
  type: 'object',
  title: 'Newsletter (Main)',
  fields: [
    ...baseContainer.fields,
    {
      name: 'title',
      title: 'Tytuł',
      type: 'string',
      initialValue: 'Zapisz się do newslettera',
    },
    {
      name: 'subtitle',
      title: 'Podtytuł',
      type: 'string',
      initialValue: 'Otrzymuj najnowsze artykuły prosto na swoją skrzynkę',
    },
    {
      name: 'description',
      title: 'Opis',
      type: 'text',
      rows: 3,
      initialValue: 'Bądź na bieżąco z naszymi podróżami, przepisami kulinarnymi i poradami podróżniczymi. Zapisz się do naszego newslettera i nie przegap żadnej przygody!',
    },
    {
      name: 'placeholder',
      title: 'Placeholder pola email',
      type: 'string',
      initialValue: 'Twój adres email',
    },
    {
      name: 'buttonText',
      title: 'Tekst przycisku',
      type: 'string',
      initialValue: 'Zapisz się',
    },
    {
      name: 'successMessage',
      title: 'Wiadomość sukcesu',
      type: 'string',
      initialValue: 'Dziękujemy za zapisanie się do newslettera!',
    },
    {
      name: 'errorMessage',
      title: 'Wiadomość błędu',
      type: 'string',
      initialValue: 'Wystąpił błąd. Spróbuj ponownie.',
    },
    {
      name: 'privacyText',
      title: 'Tekst o prywatności',
      type: 'text',
      rows: 2,
      initialValue: 'Twoje dane są bezpieczne. Nie spamujemy i możesz się wypisać w każdej chwili.',
    },
    {
      name: 'showBackground',
      title: 'Pokaż tło',
      type: 'boolean',
      initialValue: true,
      description: 'Czy sekcja ma mieć kolorowe tło',
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
