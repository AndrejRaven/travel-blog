import { defineField, defineType } from "sanity";

export default defineType({
  name: "textContent",
  title: "Treść tekstowa",
  type: "object",
  fields: [
    defineField({
      name: "container",
      title: "Kontener",
      type: "baseContainer",
      description: "Podstawowe ustawienia layoutu (szerokość, odstępy, wyrównanie)",
      group: 'properties'
    }),
    defineField({
      name: "content",
      title: "Treść",
      type: "richText",
      validation: (Rule: any) => Rule.required(),
      description: "Treść tekstowa z możliwością formatowania, linków i custom styles.",
      group: 'content'
    }),
    defineField({
      name: "layout",
      title: "Układ",
      type: "object",
      group: 'properties',
      fields: [
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
      title: "content.0.children.0.text",
      subtitle: "container.maxWidth",
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
