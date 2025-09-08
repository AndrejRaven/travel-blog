import { HeaderData } from './sanity';

export const headerFallback: HeaderData = {
  _id: 'fallback',
  title: 'Nasz Blog',
  mainNavigation: [
    { label: 'Główna', href: '/', isExternal: false },
    { label: 'O nas', href: '#o-nas', isExternal: false },
    { label: 'Kontakt', href: '#kontakt', isExternal: false },
  ],
  categoriesDropdown: {
    label: 'Kategorie',
    sections: [
      {
        key: 'places',
        title: 'Miejsca',
        emoji: '🌍',
        items: [
          { label: 'Europa', href: '#europa', isExternal: false },
          { label: 'Azja', href: '#azja', isExternal: false },
          { label: 'Ameryka Łacińska', href: '#ameryka-lacinska', isExternal: false },
          { label: 'Afryka', href: '#afryka', isExternal: false },
        ],
      },
      {
        key: 'guides',
        title: 'Poradniki',
        emoji: '🧭',
        items: [
          { label: 'Transport (loty, autostop, pociągi)', href: '#transport', isExternal: false },
          { label: 'Budżet i oszczędzanie w podróży', href: '#budzet', isExternal: false },
          { label: 'Sprzęt i pakowanie', href: '#sprzet', isExternal: false },
          { label: 'Bezpieczeństwo w podróży', href: '#bezpieczenstwo', isExternal: false },
        ],
      },
      {
        key: 'culture',
        title: 'Kultura i jedzenie',
        emoji: '🍲',
        items: [
          { label: 'Lokalne potrawy', href: '#lokalne-potrawy', isExternal: false },
          { label: 'Festiwale i wydarzenia', href: '#festiwale', isExternal: false },
        ],
      },
    ],
  },
  mobileMenu: {
    isEnabled: true,
    label: 'Menu',
  },
  ctaButton: {
    isEnabled: false,
    label: '',
    href: '',
    style: 'primary',
  },
};
