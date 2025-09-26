import { defineType } from "sanity";

export default defineType({
  name: "imageCollage",
  title: "Kolaż Zdjęć",
  type: "object",
  fields: [
    {
      name: "container",
      title: "Kontener",
      type: "baseContainer",
      description: "Podstawowe ustawienia layoutu (szerokość, odstępy, wyrównanie)",
      group: 'properties'
    },
    {
      name: "images",
      title: "Zdjęcia",
      type: "array",
      group: 'content',
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
      group: 'properties',
      fields: [
        {
          name: "textAlignment",
          title: "Wyrównanie tekstu",
          type: "string",
          options: {
            list: [
              { title: "Lewo", value: "left" },
              { title: "Środek", value: "center" },
              { title: "Prawo", value: "right" },
            ],
            layout: "radio",
          },
          initialValue: "left",
        },
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
