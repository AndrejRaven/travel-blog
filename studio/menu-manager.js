const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

// Konfiguracja Sanity
const client = createClient({
  projectId: 'k5fsny25',
  dataset: 'production',
  useCdn: false,
  token: process.env.SANITY_TOKEN,
});

class MenuManager {
  constructor() {
    this.menuFile = path.join(__dirname, 'menu-structure-example.json');
  }

  // Eksportuj obecne menu z Sanity do pliku JSON
  async exportMenu() {
    try {
      console.log('📤 Eksportuję menu z Sanity...');
      
      const header = await client.fetch('*[_type == "header"][0]');
      
      if (!header) {
        console.error('❌ Nie znaleziono dokumentu header');
        return;
      }

      const menuData = {
        mainMenu: header.mainMenu || []
      };

      fs.writeFileSync(this.menuFile, JSON.stringify(menuData, null, 2));
      console.log('✅ Menu zostało wyeksportowane do:', this.menuFile);
      
      return menuData;
    } catch (error) {
      console.error('❌ Błąd podczas eksportu:', error);
    }
  }

  // Importuj menu z pliku JSON do Sanity
  async importMenu() {
    try {
      console.log('📥 Importuję menu do Sanity...');
      
      if (!fs.existsSync(this.menuFile)) {
        console.error('❌ Plik menu nie istnieje:', this.menuFile);
        return;
      }

      const menuData = JSON.parse(fs.readFileSync(this.menuFile, 'utf8'));
      
      const existingHeader = await client.fetch('*[_type == "header"][0]');
      
      if (!existingHeader) {
        console.error('❌ Nie znaleziono dokumentu header');
        return;
      }

      const result = await client
        .patch(existingHeader._id)
        .set({ mainMenu: menuData.mainMenu })
        .commit();

      console.log('✅ Menu zostało pomyślnie zaimportowane!');
      this.printMenuSummary(menuData.mainMenu);
      
      return result;
    } catch (error) {
      console.error('❌ Błąd podczas importu:', error);
    }
  }

  // Wyświetl podsumowanie menu
  printMenuSummary(menu) {
    console.log('\n📋 Podsumowanie menu:');
    menu.forEach((item, index) => {
      console.log(`${index + 1}. ${item.label}`);
      if (item.hasDropdown && item.dropdownSections) {
        item.dropdownSections.forEach(section => {
          console.log(`   └── ${section.title} (${section.items.length} elementów)`);
        });
      }
    });
  }

  // Stwórz nowe menu z podstawową strukturą
  createBasicMenu() {
    const basicMenu = {
      mainMenu: [
        {
          label: "Podróże - świat",
          hasDropdown: true,
          dropdownSections: [
            {
              title: "Podróże na własną rękę - porady",
              emoji: "🧭",
              items: [
                {
                  label: "Planowanie podróży",
                  href: "/poradniki/planowanie",
                  isExternal: false
                }
              ]
            },
            {
              title: "Co warto zobaczyć",
              emoji: "🌍",
              items: [
                {
                  label: "Azja",
                  href: "/miejsca/azja",
                  isExternal: false,
                  hasSubmenu: true,
                  submenuItems: [
                    {
                      label: "Tajlandia",
                      href: "/miejsca/azja/tajlandia",
                      isExternal: false
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          label: "Podróże - Polska",
          href: "/polska",
          isExternal: false,
          hasDropdown: false
        }
      ]
    };

    fs.writeFileSync(this.menuFile, JSON.stringify(basicMenu, null, 2));
    console.log('✅ Utworzono podstawowe menu w:', this.menuFile);
    return basicMenu;
  }
}

// CLI interface
async function main() {
  const manager = new MenuManager();
  const command = process.argv[2];

  switch (command) {
    case 'export':
      await manager.exportMenu();
      break;
    case 'import':
      await manager.importMenu();
      break;
    case 'create':
      manager.createBasicMenu();
      break;
    default:
      console.log(`
🔧 Menu Manager - Narzędzie do zarządzania menu w Sanity

Użycie:
  node menu-manager.js export   - Eksportuj menu z Sanity do pliku JSON
  node menu-manager.js import   - Importuj menu z pliku JSON do Sanity
  node menu-manager.js create   - Stwórz podstawowe menu w pliku JSON

Przed użyciem ustaw zmienną środowiskową:
  export SANITY_TOKEN="your-token-here"
      `);
  }
}

main();
