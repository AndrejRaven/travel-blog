import { defineField, defineType } from "sanity";

export default defineType({
  name: "baseContainer",
  title: "Base Container",
  type: "object",
  initialValue: () => ({
    maxWidth: "4xl",
    padding: "md",
    margin: {
      top: "md",
      bottom: "md"
    },
    alignment: "left",
    backgroundColor: "transparent",
    borderRadius: "none",
    shadow: "none",
    height: "auto"
  }),
  fields: [
    defineField({
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
    }),
    defineField({
      name: "padding",
      title: "Wewnętrzny odstęp",
      type: "string",
      options: {
        list: [
          { title: "Brak", value: "none" },
          { title: "Bardzo mały", value: "xs" },
          { title: "Mały", value: "sm" },
          { title: "Średni", value: "md" },
          { title: "Duży", value: "lg" },
          { title: "Bardzo duży", value: "xl" },
          { title: "Ekstra duży", value: "2xl" },
        ],
      },
      initialValue: "md",
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
              { title: "Bardzo mały", value: "xs" },
              { title: "Mały", value: "sm" },
              { title: "Średni", value: "md" },
              { title: "Duży", value: "lg" },
              { title: "Bardzo duży", value: "xl" },
              { title: "Ekstra duży", value: "2xl" },
            ],
          },
          initialValue: "md",
        }),
        defineField({
          name: "bottom",
          title: "Dół",
          type: "string",
          options: {
            list: [
              { title: "Brak", value: "none" },
              { title: "Bardzo mały", value: "xs" },
              { title: "Mały", value: "sm" },
              { title: "Średni", value: "md" },
              { title: "Duży", value: "lg" },
              { title: "Bardzo duży", value: "xl" },
              { title: "Ekstra duży", value: "2xl" },
            ],
          },
          initialValue: "md",
        }),
      ],
    }),
    defineField({
      name: "alignment",
      title: "Wyrównanie",
      type: "string",
      options: {
        list: [
          { title: "Lewo", value: "left" },
          { title: "Środek", value: "center" },
          { title: "Prawo", value: "right" },
        ],
      },
      initialValue: "left",
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
    }),
    defineField({
      name: "borderRadius",
      title: "Zaokrąglenie rogów",
      type: "string",
      options: {
        list: [
          { title: "Brak", value: "none" },
          { title: "Małe", value: "sm" },
          { title: "Średnie", value: "md" },
          { title: "Duże", value: "lg" },
          { title: "Bardzo duże", value: "xl" },
          { title: "Pełne", value: "full" },
        ],
      },
      initialValue: "none",
    }),
    defineField({
      name: "shadow",
      title: "Cień",
      type: "string",
      options: {
        list: [
          { title: "Brak", value: "none" },
          { title: "Mały", value: "sm" },
          { title: "Średni", value: "md" },
          { title: "Duży", value: "lg" },
          { title: "Bardzo duży", value: "xl" },
          { title: "Ekstra duży", value: "2xl" },
        ],
      },
      initialValue: "none",
    }),
    defineField({
      name: "height",
      title: "Wysokość komponentu",
      type: "string",
      options: {
        list: [
          { title: "Auto", value: "auto" },
          { title: "10vh", value: "10vh" },
          { title: "20vh", value: "20vh" },
          { title: "30vh", value: "30vh" },
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
