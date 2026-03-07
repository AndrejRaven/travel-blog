/**
 * Globalne nazwy walut ISO 4217 w języku polskim
 * Używane w całym module travel-wallet
 */

// Pełna lista nazw walut ISO 4217 w języku polskim
export const CURRENCY_NAMES: Record<string, string> = {
  // Główne waluty
  PLN: "Polski złoty",
  USD: "Dolar amerykański",
  EUR: "Euro",
  GBP: "Funt brytyjski",
  JPY: "Jen japoński",
  CHF: "Frank szwajcarski",
  AUD: "Dolar australijski",
  CAD: "Dolar kanadyjski",
  CNY: "Yuan chiński",
  HKD: "Dolar hongkoński",
  NZD: "Dolar nowozelandzki",
  SGD: "Dolar singapurski",
  MOP: "Pataca makauńska",
  
  // Azja
  THB: "Baht tajski",
  KRW: "Won południowokoreański",
  TWD: "Dolar tajwański",
  INR: "Rupia indyjska",
  IDR: "Rupia indonezyjska",
  PHP: "Peso filipińskie",
  MYR: "Ringgit malezyjski",
  VND: "Dong wietnamski",
  PKR: "Rupia pakistańska",
  BDT: "Taka bengalska",
  LKR: "Rupia lankijska",
  NPR: "Rupia nepalska",
  MMK: "Kiat birmański",
  KHR: "Riel kambodżański",
  LAK: "Kip laotański",
  MNT: "Tugrik mongolski",
  MVR: "Rufija malediwska",
  
  // Europa
  SEK: "Korona szwedzka",
  NOK: "Korona norweska",
  DKK: "Korona duńska",
  ISK: "Korona islandzka",
  CZK: "Korona czeska",
  HUF: "Forint węgierski",
  RON: "Lej rumuński",
  BGN: "Lew bułgarski",
  HRK: "Kuna chorwacka",
  RSD: "Dinar serbski",
  BAM: "Marka zamienna Bośni i Hercegowiny",
  MKD: "Denar macedoński",
  ALL: "Lek albański",
  MDL: "Lej mołdawski",
  UAH: "Hrywna ukraińska",
  BYN: "Rubel białoruski",
  RUB: "Rubel rosyjski",
  GEL: "Lari gruziński",
  AMD: "Dram armeński",
  AZN: "Manat azerski",
  KZT: "Tenge kazachski",
  KGS: "Som kirgiski",
  UZS: "Som uzbecki",
  TJS: "Somoni tadżycki",
  TMT: "Manat turkmeński",
  
  // Bliski Wschód
  ILS: "Szekel izraelski",
  AED: "Dirham ZEA",
  SAR: "Rijal saudyjski",
  QAR: "Rijal katarski",
  KWD: "Dinar kuwejcki",
  BHD: "Dinar bahrajński",
  OMR: "Rial omański",
  JOD: "Dinar jordański",
  LBP: "Funt libański",
  SYP: "Funt syryjski",
  IQD: "Dinar iracki",
  IRR: "Rial irański",
  AFN: "Afgani afgański",
  YER: "Rial jemeński",
  
  // Afryka
  ZAR: "Rand południowoafrykański",
  EGP: "Funt egipski",
  NGN: "Naira nigeryjska",
  KES: "Szyling kenijski",
  UGX: "Szyling ugandyjski",
  TZS: "Szyling tanzański",
  ETB: "Birr etiopski",
  GHS: "Cedi ghański",
  XOF: "Frank CFA BCEAO",
  XAF: "Frank CFA BEAC",
  MAD: "Dirham marokański",
  TND: "Dinar tunezyjski",
  DZD: "Dinar algierski",
  LYD: "Dinar libijski",
  SDG: "Funt sudański",
  SSP: "Funt południowosudański",
  AOA: "Kwanza angolska",
  MZN: "Metical mozambicki",
  ZMW: "Kwacha zambijska",
  BWP: "Pula botswańska",
  MUR: "Rupia maurytyjska",
  SCR: "Rupia seszelska",
  MGA: "Ariary malgaska",
  
  // Ameryka Północna i Środkowa
  MXN: "Peso meksykańskie",
  GTQ: "Quetzal gwatemalski",
  BZD: "Dolar belizeński",
  HNL: "Lempira honduraska",
  NIO: "Córdoba nikaraguańska",
  CRC: "Colón kostarykański",
  PAB: "Balboa panamska",
  DOP: "Peso dominikańskie",
  HTG: "Gourde haitański",
  JMD: "Dolar jamajski",
  BBD: "Dolar barbadoski",
  BSD: "Dolar bahamski",
  XCD: "Dolar wschodniokaraibski",
  TTD: "Dolar trynidadzki",
  AWG: "Florin arubański",
  ANG: "Gulden antylski",
  CUP: "Peso kubańskie",
  
  // Ameryka Południowa
  BRL: "Real brazylijski",
  ARS: "Peso argentyńskie",
  CLP: "Peso chilijskie",
  COP: "Peso kolumbijskie",
  PEN: "Sol peruwiański",
  UYU: "Peso urugwajskie",
  PYG: "Guarani paragwajski",
  BOB: "Boliviano",
  VES: "Bolívar wenezuelski",
  GYD: "Dolar gujański",
  SRD: "Dolar surinamski",
  FKP: "Funt falklandzki",
  
  // Oceania
  FJD: "Dolar fidżyjski",
  PGK: "Kina papuaska",
  SBD: "Dolar Wysp Salomona",
  TOP: "Pa'anga tongijska",
  WST: "Tala samoańska",
  VUV: "Vatu vanuackie",
  XPF: "Frank CFP",
  
  // Inne
  TRY: "Lira turecka",
  BND: "Dolar brunejski",
  KYD: "Dolar kajmański",
  BMD: "Dolar bermudzki",
  GIP: "Funt gibraltarski",
  SHP: "Funt Świętej Heleny",
  ERN: "Nakfa erytrejska",
  DJF: "Frank dżibutyjski",
  SOS: "Szyling somalijski",
  KMF: "Frank komoryjski",
  RWF: "Frank rwandyjski",
  BIF: "Frank burundyjski",
  MWK: "Kwacha malawijska",
  ZWL: "Dolar Zimbabwe",
  STN: "Dobra Wysp Świętego Tomasza i Książęcej",
  CVE: "Escudo zielonoprzylądkowe",
  GMD: "Dalasi gambijska",
  GNF: "Frank gwinejski",
  SLL: "Leone sierraleoński",
  SLE: "Leone sierraleoński",
  LRD: "Dolar liberyjski",
  CDF: "Frank kongijski",
  SZL: "Lilangeni suazyjski",
  LSL: "Loti lesotyjski",
  NAD: "Dolar namibijski",
  BTN: "Ngultrum bhutański",
  CLF: "Unidad de Fomento chilijska",
  CNH: "Yuan chiński (offshore)",
  FOK: "Korona Wysp Owczych",
  GGP: "Funt Guernsey",
  IMP: "Funt Man",
  JEP: "Funt Jersey",
  KID: "Dolar kiribatyjski",
  MRU: "Ugija mauretańska",
  TVD: "Dolar tuvalu",
  XCG: "Korona wschodniokaraibska",
  ZWG: "Dolar Zimbabwe (2009)",
};

/**
 * Skrócone nazwy walut dla wyświetlania w headerze i kompaktowych miejscach
 */
export const CURRENCY_SHORT_NAMES: Record<string, string> = {
  PLN: "zł",
  EUR: "euro",
  USD: "dolar amer",
  GBP: "funt bryt",
  JPY: "jen jap",
  CHF: "frank",
  AUD: "dolar aus",
  CAD: "dolar kan",
  THB: "baht",
  KRW: "won",
  TWD: "dolar tajw",
  INR: "rupia",
  IDR: "rupia ind",
  PHP: "peso fil",
  MYR: "ringgit",
  VND: "dong",
  KZT: "tenge kaz",
  KGS: "som kir",
  UZS: "som uz",
  TJS: "somoni",
  TMT: "manat",
  RUB: "rubel",
  UAH: "hrywna",
  BYN: "rubel bia",
  GEL: "lari",
  AMD: "dram",
  AZN: "manat az",
  TRY: "lira",
  ILS: "szekel",
  AED: "dirham",
  SAR: "rijal",
  // Dodaj więcej według potrzeb
};

/**
 * Pobiera pełną nazwę waluty
 * @param currency - Kod waluty (np. "USD", "EUR")
 * @returns Pełna nazwa waluty w języku polskim lub kod waluty, jeśli nie znaleziono
 */
export function getCurrencyName(currency: string): string {
  return CURRENCY_NAMES[currency] || currency;
}

/**
 * Pobiera skróconą nazwę waluty dla wyświetlania w headerze
 * @param currency - Kod waluty (np. "USD", "EUR")
 * @returns Skrócona nazwa waluty lub kod waluty w małych literach, jeśli nie znaleziono
 */
export function getCurrencyShortName(currency: string): string {
  return CURRENCY_SHORT_NAMES[currency] || currency.toLowerCase();
}
