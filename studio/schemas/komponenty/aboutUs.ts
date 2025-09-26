import baseContainer from "../shared/baseContainer";

export default {
  name: 'aboutUs',
  type: 'object',
  title: 'O nas (Aside)',
  fields: [
    ...baseContainer.fields,
    {
      name: 'title',
      title: 'Tytuł',
      type: 'string',
      initialValue: 'Kim jesteśmy',
    },
    {
      name: 'image',
      title: 'Zdjęcie',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'imageAlt',
      title: 'Alt tekst zdjęcia',
      type: 'string',
      initialValue: 'O nas - para podróżników',
    },
    {
      name: 'description',
      title: 'Opis',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Każdy element to osobny akapit',
      initialValue: [
        'Jesteśmy Aga i Andrej - para, która od kilku lat przemierza świat w poszukiwaniu najpiękniejszych miejsc i najsmaczniejszych potraw. Nasze podróże to nie tylko zwiedzanie, ale przede wszystkim poznawanie lokalnych kultur i tradycji.',
        'Na tym blogu dzielimy się naszymi doświadczeniami, praktycznymi poradami podróżniczymi oraz przepisami kulinarnymi z różnych zakątków świata. Każda podróż to nowa historia do opowiedzenia.',
        'Dołącz do nas w tej podróży pełnej przygód, smaków i niezapomnianych wspomnień!'
      ],
    },
    {
      name: 'contactHref',
      title: 'Link kontaktowy',
      type: 'string',
      initialValue: '#kontakt',
    },
    {
      name: 'contactText',
      title: 'Tekst przycisku kontaktowego',
      type: 'string',
      initialValue: 'Skontaktuj się z nami',
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description.0',
      media: 'image',
    },
    prepare(selection: any) {
      const { title, subtitle, media } = selection;
      return {
        title: title || 'O nas',
        subtitle: subtitle ? subtitle.substring(0, 50) + '...' : 'Brak opisu',
        media: media,
      };
    },
  },
}
