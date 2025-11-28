import { defineField, defineType } from "sanity";

export default defineType({
  name: "author",
  type: "document",
  title: "Autor",
  fields: [
    defineField({
      name: "name",
      type: "string",
      title: "Imię i nazwisko",
      validation: (Rule) => Rule.required().min(2).max(120),
    }),
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      description: "Używany w adresach URL (np. dla strony autora)",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "role",
      type: "string",
      title: "Rola",
      description: "Np. Redaktor naczelny, Podróżnik, Dietetyk",
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: "shortBio",
      type: "text",
      rows: 4,
      title: "Krótki bio",
      description: "Wyświetlane na stronach postów (max. 400 znaków)",
      validation: (Rule) => Rule.required().max(400),
    }),
    defineField({
      name: "bio",
      type: "array",
      title: "Pełne bio",
      description: "Szczegółowy opis (opcjonalny, RichText)",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "avatar",
      type: "image",
      title: "Zdjęcie autora",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "website",
      type: "url",
      title: "Strona WWW",
    }),
    defineField({
      name: "socials",
      type: "object",
      title: "Profile społecznościowe",
      fields: [
        { name: "facebook", type: "url", title: "Facebook" },
        { name: "instagram", type: "url", title: "Instagram" },
        { name: "youtube", type: "url", title: "YouTube" },
        { name: "twitter", type: "url", title: "Twitter" },
        { name: "linkedin", type: "url", title: "LinkedIn" },
      ],
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "role",
      media: "avatar",
    },
  },
});

