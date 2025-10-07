import { defineMigration, at, setIfMissing } from 'sanity/migrate'

export default defineMigration({
  title: 'Dodaj domyślną wartość "none" dla pola innerMargin w baseContainer',
  documentTypes: [
    'homepage',
    'post', 
    'category'
  ],
  migrate: {
    document(doc, context) {
      const patches = []
      
      // Sprawdź wszystkie pola w dokumencie, które mogą zawierać baseContainer
      if (doc.sections && Array.isArray(doc.sections)) {
        doc.sections.forEach((section: any, sectionIndex: number) => {
          if (section && typeof section === 'object') {
            // Sprawdź czy sekcja ma pole container typu baseContainer
            if (section.container && typeof section.container === 'object') {
              // Sprawdź czy innerMargin jest undefined lub null
              if (section.container.innerMargin === undefined || section.container.innerMargin === null) {
                patches.push(
                  at(['sections', sectionIndex, 'container', 'innerMargin'], setIfMissing('none'))
                )
              }
            }
          }
        })
      }
      
      // Sprawdź inne możliwe pola z baseContainer
      const checkContainerField = (fieldName: string) => {
        if (doc[fieldName] && typeof doc[fieldName] === 'object' && doc[fieldName]._type === 'baseContainer') {
          if (doc[fieldName].innerMargin === undefined || doc[fieldName].innerMargin === null) {
            patches.push(
              at([fieldName, 'innerMargin'], setIfMissing('none'))
            )
          }
        }
      }
      
      // Sprawdź pola, które mogą być baseContainer
      checkContainerField('container')
      checkContainerField('heroBanner')
      checkContainerField('backgroundHeroBanner')
      checkContainerField('newsletter')
      checkContainerField('textContent')
      checkContainerField('embedYoutube')
      checkContainerField('articles')
      checkContainerField('aboutUs')
      checkContainerField('categoriesSection')
      checkContainerField('instagramSection')
      checkContainerField('youtubeChannel')
      checkContainerField('imageCollage')
      checkContainerField('supportSection')
      
      return patches.length > 0 ? patches : undefined
    },
    
    // Dodatkowo sprawdź wszystkie obiekty baseContainer w dokumencie
    object(node, path, context) {
      // Sprawdź czy to jest obiekt baseContainer
      if (node && typeof node === 'object' && node._type === 'baseContainer') {
        if (node.innerMargin === undefined || node.innerMargin === null) {
          return at('innerMargin', setIfMissing('none'))
        }
      }
    }
  },
})
