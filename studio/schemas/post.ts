export default {
  name: 'post',
  type: 'document',
  title: 'Post',
  fields: [
    {
      name: 'title',
      title: 'Tytuł',
      type: 'string',
    },
    {
      name: 'slug',
      title: 'Slug (adres URL)',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
    },
    {
      name: 'coverImage',
      title: 'Zdjęcie główne',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'publishedAt',
      title: 'Data publikacji',
      type: 'datetime',
    },
    {
      name: 'components',
      title: 'Komponenty',
      type: 'array',
      of: [
        { type: 'heroBanner' },
        { type: 'backgroundHeroBanner' },
        { type: 'textContent' },
        { type: 'imageCollage' },
        // Tutaj będziemy dodawać kolejne komponenty jak karuzele, blog artykułów, kategorie, embedy YouTube itp.
      ],
      description: 'Dodaj komponenty, które będą wyświetlane na stronie posta',
    },
  ],
}