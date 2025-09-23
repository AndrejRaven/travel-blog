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
      name: 'subtitle',
      title: 'Podtytuł',
      type: 'string',
    },
    {
      name: 'categories',
      title: 'Kategorie',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'category' }],
        },
      ],
      validation: (Rule: any) => Rule.min(1).error('Post musi mieć przynajmniej jedną kategorię'),
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
    name: 'coverMobileImage',
    title: 'Zdjęcie główne (mobile)',
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
        { type: 'embedYoutube' },
        // Tutaj będziemy dodawać kolejne komponenty jak karuzele, blog artykułów, kategorie itp.
      ],
      description: 'Dodaj komponenty, które będą wyświetlane na stronie posta',
    },
  ],
}