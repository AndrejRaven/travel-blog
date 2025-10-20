import { StructureBuilder } from 'sanity/structure'
import { schemaTypes } from './schemaTypes'
import { schemaTypesComponents } from './schemaTypes/schemaTypesComponents'

export const deskStructure = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      // STRONY
      S.listItem()
        .title('Strony')
        .icon(() => '🏠')
        .child(
          S.list()
            .title('Strony')
            .items([
              S.listItem()
                .title('Strona główna')
                .icon(() => '🏠')
                .child(
                  S.documentTypeList('homepage')
                    .title('Strona główna')
                    .filter('_type == "homepage"')
                    .params({ limit: 1 })
                ),
              S.listItem()
                .title('Posty')
                .icon(() => '📝')
                .child(
                  S.documentTypeList('post')
                    .title('Posty')
                    .filter('_type == "post"')
                    .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
                ),
            ])
        ),

      // NAWIGACJA
      S.listItem()
        .title('Nawigacja')
        .icon(() => '🧭')
        .child(
          S.documentTypeList('header')
            .title('Nawigacja')
            .filter('_type == "header"')
        ),

      // KATEGORIE - Hierarchia 3-poziomowa
      S.listItem()
        .title('Kategorie')
        .icon(() => '📂')
        .child(
          S.list()
            .title('Kategorie')
            .items([
              // Kategorie nadrzędne
              S.listItem()
                .title('Kategorie nadrzędne')
                .icon(() => '📁')
                .child(
                  S.documentTypeList('superCategory')
                    .title('Kategorie nadrzędne')
                    .filter('_type == "superCategory"')
                    .defaultOrdering([{ field: 'name', direction: 'asc' }])
                ),

              // Kategorie główne
              S.listItem()
                .title('Kategorie główne')
                .icon(() => '📂')
                .child(
                  S.documentTypeList('mainCategory')
                    .title('Kategorie główne')
                    .filter('_type == "mainCategory"')
                    .defaultOrdering([{ field: 'name', direction: 'asc' }])
                ),

              // Podkategorie
              S.listItem()
                .title('Podkategorie')
                .icon(() => '📄')
                .child(
                  S.documentTypeList('category')
                    .title('Podkategorie')
                    .filter('_type == "category"')
                    .defaultOrdering([{ field: 'name', direction: 'asc' }])
                ),
            ])
        ),

      // KOMENTARZE
      S.listItem()
        .title('Komentarze')
        .icon(() => '💬')
        .child(
          S.documentTypeList('comment')
            .title('Komentarze')
            .filter('_type == "comment"')
            .defaultOrdering([{ field: '_createdAt', direction: 'desc' }])
        ),

      // DODATKOWE DOKUMENTY (tylko główne typy treści)
      ...S.documentTypeListItems().filter(
        (listItem) =>
          !['homepage', 'post', 'header', 'superCategory', 'mainCategory', 'category', 'comment', 'button', 'richText', 'baseContainer'].includes(
            listItem.getId() || ''
          ) && !schemaTypesComponents.some((comp) => comp.name === listItem.getId())
      ),
    ])
