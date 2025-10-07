import { defineMigration, at, setIfMissing } from 'sanity/migrate'

export default defineMigration({
  title: 'Dodaj domyślną wartość "none" dla pola innerMargin w baseContainer - wersja uniwersalna',
  migrate: {
    // Sprawdź wszystkie obiekty w dokumencie
    object(node, path, context) {
      // Sprawdź czy to jest obiekt baseContainer
      if (node && typeof node === 'object' && node._type === 'baseContainer') {
        // Sprawdź czy innerMargin jest undefined, null lub pusty string
        if (node.innerMargin === undefined || node.innerMargin === null || node.innerMargin === '') {
          return at('innerMargin', setIfMissing('none'))
        }
      }
      
      // Sprawdź czy to jest obiekt z polem container typu baseContainer
      if (node && typeof node === 'object' && node.container && typeof node.container === 'object' && node.container._type === 'baseContainer') {
        if (node.container.innerMargin === undefined || node.container.innerMargin === null || node.container.innerMargin === '') {
          return at(['container', 'innerMargin'], setIfMissing('none'))
        }
      }
    }
  },
})
