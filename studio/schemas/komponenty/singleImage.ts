import { defineType } from "sanity";

export default defineType({
  name: "singleImage",
  title: "Pojedynczy obraz",
  type: "object",
  groups: [
    {
      name: "content",
      title: "Treść",
      default: true,
    },
    {
      name: "properties",
      title: "Właściwości",
    },
  ],
  fields: [
    {
      name: "container",
      title: "Kontener",
      type: "baseContainer",
      description:
        "Podstawowe ustawienia layoutu (szerokość, odstępy, wyrównanie)",
      group: "properties",
    },
    {
      name: "image",
      title: "Obraz",
      type: "image",
      group: "content",
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: "alt",
          title: "Tekst alternatywny",
          type: "string",
          description: "Opis obrazu dla czytników ekranu",
        },
      ],
      validation: (Rule) =>
        Rule.required().error("Dodaj obraz, który chcesz wyświetlić"),
    },
    {
      name: "caption",
      title: "Podpis",
      type: "string",
      group: "content",
      description: "Krótki podpis wyświetlany pod obrazem (opcjonalnie)",
    },
    {
      name: "description",
      title: "Opis",
      type: "text",
      rows: 3,
      group: "content",
      description: "Dłuższy opis lub dodatkowe informacje (opcjonalnie)",
    },
    {
      name: "download",
      title: "Plik do pobrania",
      type: "object",
      group: "content",
      fields: [
        {
          name: "label",
          title: "Tekst przycisku",
          type: "string",
          initialValue: "Pobierz pełny wykres",
        },
        {
          name: "url",
          title: "URL pliku",
          type: "url",
          description:
            "Pełny adres do oryginalnego wykresu (np. PDF lub PNG z wysoką jakołością)",
        },
      ],
    },
  ],
  preview: {
    select: {
      media: "image",
      caption: "caption",
    },
    prepare({ media, caption }) {
      return {
        title: caption || "Pojedynczy obraz",
        subtitle: caption ? "Z podpisem" : "Bez podpisu",
        media,
      };
    },
  },
});

