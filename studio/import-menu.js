const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

// Konfiguracja Sanity
const client = createClient({
  projectId: 'k5fsny25',
  dataset: 'production',
  useCdn: false,
  token: process.env.SANITY_TOKEN, // Musisz ustawić token w zmiennych środowiskowych
});

// Wczytaj dane menu z pliku JSON
const menuData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'menu-structure-example.json'), 'utf8')
);

async function importMenu() {
  try {
    console.log('🚀 Rozpoczynam import menu...');
    
    // Pobierz istniejący dokument header
    const existingHeader = await client.fetch('*[_type == "header"][0]');
    
    if (!existingHeader) {
      console.error('❌ Nie znaleziono dokumentu header w Sanity');
      return;
    }

    // Zaktualizuj dokument header z nowym menu
    const updatedHeader = {
      ...existingHeader,
      mainMenu: menuData.mainMenu
    };

    // Zapisz zaktualizowany dokument
    const result = await client
      .patch(existingHeader._id)
      .set({ mainMenu: menuData.mainMenu })
      .commit();

    console.log('✅ Menu zostało pomyślnie zaimportowane!');
    console.log('📊 Zaimportowano:', menuData.mainMenu.length, 'elementów menu');
    
    // Wyświetl podsumowanie
    menuData.mainMenu.forEach((item, index) => {
      console.log(`${index + 1}. ${item.label}`);
      if (item.hasDropdown && item.dropdownSections) {
        item.dropdownSections.forEach(section => {
          console.log(`   └── ${section.title} (${section.items.length} elementów)`);
        });
      }
    });

  } catch (error) {
    console.error('❌ Błąd podczas importu menu:', error);
  }
}

// Uruchom import
importMenu();
