import { defineType } from "sanity";

export default defineType({
  name: "imageCollage",
  title: "Kolaż Zdjęć",
  type: "object",
  fieldsets: [
    {
      name: 'content',
      title: 'Treść',
      options: { collapsible: true, collapsed: false }
    },
    {
      name: 'properties',
      title: 'Właściwości',
      options: { collapsible: true, collapsed: false }
    }
  ],
  fields: [
    {
      name: "container",
      title: "Kontener",
      type: "baseContainer",
      description: "Podstawowe ustawienia layoutu (szerokość, odstępy, wyrównanie)",
      fieldset: 'properties'
    },
    {
      name: "images",
      title: "Zdjęcia",
      type: "array",
      fieldset: 'content',
      of: [
        {
          type: "image",
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: "alt",
              title: "Tekst alternatywny",
              type: "string",
              description: "Opis zdjęcia dla czytników ekranu",
            },
          ],
        },
      ],
      validation: (Rule) => Rule.min(2).max(5).error("Kolaż musi zawierać od 2 do 5 zdjęć"),
    },
    {
      name: "layout",
      title: "Układ",
      type: "object",
      fieldset: 'properties',
      fields: [
        {
          name: "thumbnailCount",
          title: "Liczba miniatur",
          type: "number",
          options: {
            list: [
              { title: "2 miniatury", value: 2 },
              { title: "3 miniatury", value: 3 },
              { title: "4 miniatury", value: 4 },
            ],
          },
          initialValue: 3,
          validation: (Rule) => Rule.required().error("Wybierz liczbę miniatur"),
        },
      ],
    },
  ],
  preview: {
    select: {
      images: "images",
      thumbnailCount: "layout.thumbnailCount",
    },
    prepare({ images, thumbnailCount }) {
      const imageCount = images?.length || 0;
      return {
        title: `Kolaż Zdjęć (${imageCount} zdjęć)`,
        subtitle: `${thumbnailCount} miniatur`,
        media: images?.[0],
      };
    },
  },
});
