// Cache dla footer - może być statyczny lub z Sanity w przyszłości
let footerDataCache: any = null;

export const getCachedFooterData = () => {
  return footerDataCache;
};

export const setCachedFooterData = (data: any) => {
  footerDataCache = data;
};

// Footer może być statyczny, ale przygotowujemy cache na przyszłość
export const initializeFooterCache = () => {
  // Footer jest statyczny, więc nie potrzebujemy pobierania danych
  // W przyszłości można dodać pobieranie z Sanity
  return true;
};
