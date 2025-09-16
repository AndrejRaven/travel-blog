import { defineField, defineType } from "sanity";

export default defineType({
  name: "textContent",
  title: "Treść tekstowa",
  type: "object",
  fields: [
    defineField({
      name: "content",
      title: "Treść",
      type: "array",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normalny", value: "normal" },
            { title: "H1", value: "h1" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
          ],
          marks: {
            decorators: [
              { title: "Pogrubiony", value: "strong" },
              { title: "Kursywa", value: "em" },
            ],
            annotations: [
              {
                name: "link",
                type: "object",
                title: "Link",
                fields: [
                  {
                    name: "linkType",
                    type: "string",
                    title: "Typ linku",
                    options: {
                      list: [
                        { title: "Wewnętrzny", value: "internal" },
                        { title: "Zewnętrzny", value: "external" },
                      ],
                    },
                    initialValue: "internal",
                  },
                  {
                    name: "internalHref",
                    type: "string",
                    title: "Link wewnętrzny",
                    hidden: ({ parent }) => parent?.linkType !== "internal",
                  },
                  {
                    name: "externalHref",
                    type: "url",
                    title: "Link zewnętrzny",
                    hidden: ({ parent }) => parent?.linkType !== "external",
                  },
                  {
                    name: "blank",
                    type: "boolean",
                    title: "Otwórz w nowej karcie",
                    initialValue: false,
                  },
                ],
              },
              {
                name: "customStyle",
                type: "object",
                title: "Niestandardowy styl",
                fields: [
                  {
                    name: "style",
                    type: "string",
                    title: "Styl",
                    options: {
                      list: [
                        { title: "Link podstawowy", value: "link-primary" },
                        { title: "Link drugorzędny", value: "link-secondary" },
                        { title: "Margines górny", value: "margin-top" },
                        { title: "Margines dolny", value: "margin-bottom" },
                        { title: "Podświetlenie", value: "highlight" },
                        { title: "Ostrzeżenie", value: "warning" },
                        { title: "Sukces", value: "success" },
                        { title: "Błąd", value: "error" },
                        { title: "Informacja", value: "info" },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
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
