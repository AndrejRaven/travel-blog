import { defineField, defineType } from "sanity";

export default defineType({
  name: "textContent",
  title: "Treść tekstowa",
  type: "object",
  fields: [
    defineField({
      name: "content",
      title: "Treść",
      type: "richText",
      validation: (Rule: any) => Rule.required(),
      description: "Treść tekstowa z możliwością formatowania, linków i custom styles.",
    }),
    defineField({
      name: "layout",
      title: "Układ",
      type: "object",
      fields: [
        defineField({
          name: "maxWidth",
          title: "Maksymalna szerokość",
          type: "string",
          options: {
            list: [
              { title: "Mała (sm)", value: "sm" },
              { title: "Średnia (md)", value: "md" },
              { title: "Duża (lg)", value: "lg" },
              { title: "Bardzo duża (xl)", value: "xl" },
              { title: "2XL", value: "2xl" },
              { title: "4XL", value: "4xl" },
              { title: "6XL", value: "6xl" },
              { title: "Pełna szerokość", value: "full" },
            ],
          },
          initialValue: "4xl",
        }),
        defineField({
          name: "padding",
          title: "Wewnętrzny odstęp",
          type: "string",
          options: {
            list: [
              { title: "Brak", value: "none" },
              { title: "Mały", value: "sm" },
              { title: "Średni", value: "md" },
              { title: "Duży", value: "lg" },
              { title: "Bardzo duży", value: "xl" },
            ],
          },
          initialValue: "md",
        }),
        defineField({
          name: "textSize",
          title: "Rozmiar tekstu",
          type: "string",
          options: {
            list: [
              { title: "Mały", value: "sm" },
              { title: "Podstawowy", value: "base" },
              { title: "Duży", value: "lg" },
              { title: "Bardzo duży", value: "xl" },
            ],
          },
          initialValue: "lg",
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "content.0.children.0.text",
      subtitle: "layout.maxWidth",
    },
    prepare(selection) {
      const { title, subtitle } = selection;
      return {
        title: title || "Treść tekstowa",
        subtitle: `Szerokość: ${subtitle || "4xl"}`,
      };
    },
  },
});
