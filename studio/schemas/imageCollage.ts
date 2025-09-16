import { defineType } from "sanity";

export default defineType({
  name: "imageCollage",
  title: "Kolaż Zdjęć",
  type: "object",
  fields: [
    {
      name: "images",
      title: "Zdjęcia",
      type: "array",
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
      fields: [
        {
          name: "maxWidth",
          title: "Maksymalna szerokość",
          type: "string",
          options: {
            list: [
              { title: "Bardzo mała (sm)", value: "sm" },
              { title: "Mała (md)", value: "md" },
              { title: "Średnia (lg)", value: "lg" },
              { title: "Duża (xl)", value: "xl" },
              { title: "Bardzo duża (2xl)", value: "2xl" },
              { title: "Ekstra duża (4xl)", value: "4xl" },
              { title: "Mega duża (6xl)", value: "6xl" },
              { title: "Pełna szerokość", value: "full" },
            ],
          },
          initialValue: "4xl",
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
