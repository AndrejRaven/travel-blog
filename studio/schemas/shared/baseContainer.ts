import { defineField, defineType } from "sanity";

export default defineType({
  name: "baseContainer",
  title: "Base Container",
  type: "object",
  fields: [
    defineField({
      name: "maxWidth",
      title: "Maksymalna szerokość",
      type: "string",
      options: {
        list: [
          { title: "4XL", value: "4xl" },
          { title: "6XL", value: "6xl" },
          { title: "Pełna szerokość", value: "full" },
        ],
      },
      initialValue: "4xl",
      validation: (Rule) => Rule.required().error("Maksymalna szerokość jest wymagana"),
    }),
    defineField({
      name: "padding",
      title: "Wewnętrzny odstęp",
      type: "string",
      options: {
        list: [
          { title: "Brak", value: "none" },
          { title: "MD", value: "md" },
          { title: "XL", value: "xl" },
          { title: "2XL", value: "2xl" },
        ],
      },
      initialValue: "md",
      validation: (Rule) => Rule.required().error("Wewnętrzny odstęp jest wymagany"),
    }),
    defineField({
      name: "margin",
      title: "Zewnętrzny odstęp",
      type: "object",
      fields: [
        defineField({
          name: "top",
          title: "Góra",
          type: "string",
          options: {
            list: [
              { title: "Brak", value: "none" },
              { title: "XL", value: "xl" },
              { title: "2XL", value: "2xl" },
            ],
          },
          initialValue: "none",
          validation: (Rule) => Rule.required().error("Margines góra jest wymagany"),
        }),
        defineField({
          name: "bottom",
          title: "Dół",
          type: "string",
          options: {
            list: [
              { title: "Brak", value: "none" },
              { title: "XL", value: "xl" },
              { title: "2XL", value: "2xl" },
            ],
          },
          initialValue: "md",
          validation: (Rule) => Rule.required().error("Margines dół jest wymagany"),
        }),
      ],
    }),
    defineField({
      name: "backgroundColor",
      title: "Kolor tła",
      type: "string",
      options: {
        list: [
          { title: "Przezroczyste", value: "transparent" },
          { title: "Delikatny", value: "subtle" },
          { title: "Akcent", value: "accent" },
        ],
      },
      initialValue: "transparent",
      validation: (Rule) => Rule.required().error("Kolor tła jest wymagany"),
    }),
    defineField({
      name: "borderRadius",
      title: "Zaokrąglenie rogów",
      type: "string",
      options: {
        list: [
          { title: "Brak", value: "none" },
          { title: "LG", value: "lg" },
          { title: "XL", value: "xl" },
          { title: "2XL", value: "2xl" },
          { title: "Pełne", value: "full" },
        ],
      },
      initialValue: "none",
      validation: (Rule) => Rule.required().error("Zaokrąglenie rogów jest wymagane"),
    }),
    defineField({
      name: "shadow",
      title: "Cień",
      type: "string",
      options: {
        list: [
          { title: "Brak", value: "none" },
          { title: "LG", value: "lg" },
          { title: "XL", value: "xl" },
          { title: "Ekstra duży", value: "2xl" },
        ],
      },
      initialValue: "none",
      validation: (Rule) => Rule.required().error("Cień jest wymagany"),
    }),
    defineField({
      name: "height",
      title: "Wysokość komponentu",
      type: "string",
      options: {
        list: [
          { title: "Auto", value: "auto" },
          { title: "40vh", value: "40vh" },
          { title: "50vh", value: "50vh" },
          { title: "60vh", value: "60vh" },
          { title: "70vh", value: "70vh" },
          { title: "80vh", value: "80vh" },
          { title: "90vh", value: "90vh" },
          { title: "100vh", value: "100vh" },
        ],
      },
      initialValue: "auto",
      validation: (Rule) => Rule.required().error("Wysokość komponentu jest wymagana"),
    }),
    defineField({
      name: "contentTitle",
      title: "Tytuł treści",
      description: "Opcjonalny tytuł używany do tworzenia spisu treści. Jeśli pozostawisz puste, sekcja nie będzie uwzględniona w nawigacji.",
      type: "string",
      validation: (Rule) => Rule.max(100).warning("Tytuł powinien mieć maksymalnie 100 znaków"),
    }),
  ],
  preview: {
    select: {
      maxWidth: "maxWidth",
      padding: "padding",
      backgroundColor: "backgroundColor",
      height: "height",
      contentTitle: "contentTitle",
    },
    prepare({ maxWidth, padding, backgroundColor, height, contentTitle }) {
      const title = contentTitle ? `"${contentTitle}"` : "Base Container";
      return {
        title: title,
        subtitle: `${maxWidth || "4xl"} | ${padding || "md"} | ${backgroundColor || "transparent"} | ${height || "auto"}`,
      };
    },
  },
});
