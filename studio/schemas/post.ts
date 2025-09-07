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
      name: 'body',
      title: 'Treść',
      type: 'array',
      of: [{ type: 'block' }],
    },
  ],
}