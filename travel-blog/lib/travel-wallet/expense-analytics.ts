import type { Expense } from "./types";
import { getDailyPortions, getDaysWithExpensePortions, getExpenseDays } from "./calendar";

/**
 * Grupuje wydatki według dnia. Wielodniowe wydatki trafiają do każdego dnia z zakresu z udziałem (portion).
 */
export function groupExpensesByDay(expenses: Expense[]): Record<string, Expense[]> {
  const grouped: Record<string, Expense[]> = {};
  getDailyPortions(expenses).forEach(({ date, expense }) => {
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(expense);
  });
  return grouped;
}

/**
 * Grupuje wydatki według tygodnia (poniedziałek-niedziela)
 */
export function groupExpensesByWeek(expenses: Expense[]): Record<string, Expense[]> {
  const grouped: Record<string, Expense[]> = {};
  
  expenses.forEach((expense) => {
    const date = new Date(expense.date);
    // Ustaw na poniedziałek tygodnia
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    
    const weekKey = monday.toISOString().split('T')[0];
    
    if (!grouped[weekKey]) {
      grouped[weekKey] = [];
    }
    grouped[weekKey].push(expense);
  });
  
  return grouped;
}

/**
 * Grupuje wydatki według miesiąca
 */
export function groupExpensesByMonth(expenses: Expense[]): Record<string, Expense[]> {
  const grouped: Record<string, Expense[]> = {};
  
  expenses.forEach((expense) => {
    const date = new Date(expense.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(expense);
  });
  
  return grouped;
}

/**
 * Oblicza sumę wydatków dla każdego dnia (wielodniowe = suma portions w walucie wydatku per dzień).
 */
export function calculateDailyTotals(expenses: Expense[]): Array<{ date: string; total: number; count: number }> {
  const portions = getDailyPortions(expenses);
  const byDate: Record<string, { total: number; count: number }> = {};
  portions.forEach(({ date, amountPortion }) => {
    if (!byDate[date]) byDate[date] = { total: 0, count: 0 };
    byDate[date].total += amountPortion;
    byDate[date].count += 1;
  });
  return Object.entries(byDate)
    .map(([date, { total, count }]) => ({ date, total, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Oblicza sumę wydatków w PLN dla każdego dnia. Wielodniowe wydatki (date + endDate)
 * są rozkładane równo na wszystkie dni z zakresu [date, endDate] włącznie.
 */
export function calculateDailyTotalsInPLN(
  expenses: Expense[],
  convertToPLN: (e: Expense) => number
): Array<{ date: string; total: number; count: number }> {
  const byDate: Record<string, { total: number; count: number }> = {};
  expenses.forEach((expense) => {
    const days = getExpenseDays(expense).map((d) => d.date);
    const portion = days.length > 0 ? convertToPLN(expense) / days.length : 0;
    days.forEach((date) => {
      if (!byDate[date]) byDate[date] = { total: 0, count: 0 };
      byDate[date].total += portion;
      byDate[date].count += 1;
    });
  });
  return Object.entries(byDate)
    .map(([date, { total, count }]) => ({ date, total, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Oblicza sumę wydatków dla każdego tygodnia
 */
export function calculateWeeklyTotals(expenses: Expense[]): Array<{ week: string; total: number; count: number }> {
  const grouped = groupExpensesByWeek(expenses);
  
  return Object.entries(grouped)
    .map(([week, weekExpenses]) => ({
      week,
      total: weekExpenses.reduce((sum, exp) => sum + exp.amount, 0),
      count: weekExpenses.length,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

/**
 * Oblicza sumę wydatków dla każdego miesiąca
 */
export function calculateMonthlyTotals(expenses: Expense[]): Array<{ month: string; total: number; count: number }> {
  const grouped = groupExpensesByMonth(expenses);
  
  return Object.entries(grouped)
    .map(([month, monthExpenses]) => ({
      month,
      total: monthExpenses.reduce((sum, exp) => sum + exp.amount, 0),
      count: monthExpenses.length,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Statystyki wydatków według dnia tygodnia
 */
export function getDayOfWeekStats(expenses: Expense[]): Record<string, { total: number; count: number }> {
  const stats: Record<string, { total: number; count: number }> = {
    'Poniedziałek': { total: 0, count: 0 },
    'Wtorek': { total: 0, count: 0 },
    'Środa': { total: 0, count: 0 },
    'Czwartek': { total: 0, count: 0 },
    'Piątek': { total: 0, count: 0 },
    'Sobota': { total: 0, count: 0 },
    'Niedziela': { total: 0, count: 0 },
  };
  
  const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

  getDailyPortions(expenses).forEach(({ date, amountPortion }) => {
    const dayName = dayNames[new Date(date).getDay()];
    if (stats[dayName]) {
      stats[dayName].total += amountPortion;
      stats[dayName].count += 1;
    }
  });

  return stats;
}

/**
 * Wykrywa wzorce wydatków. Jeśli podano convertToPLN, wielodniowe wydatki są rozkładane na dni i najdroższy dzień w PLN.
 */
export function detectSpendingPatterns(
  expenses: Expense[],
  convertToPLN?: (e: Expense) => number
): {
  highestDay: { date: string; total: number } | null;
  highestCategory: { category: string; total: number; percentage: number } | null;
  averageDaily: number;
  weekendSpending: { total: number; percentage: number };
  weekdaySpending: { total: number; percentage: number };
} {
  if (expenses.length === 0) {
    return {
      highestDay: null,
      highestCategory: null,
      averageDaily: 0,
      weekendSpending: { total: 0, percentage: 0 },
      weekdaySpending: { total: 0, percentage: 0 },
    };
  }

  const dailyTotals = convertToPLN
    ? calculateDailyTotalsInPLN(expenses, convertToPLN)
    : calculateDailyTotals(expenses);
  const highestDay = dailyTotals.reduce(
    (max, day) => (day.total > max.total ? day : max),
    dailyTotals[0] || { date: "", total: 0 }
  );
  
  // Najczęstsza kategoria
  const categoryTotals: Record<string, number> = {};
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  expenses.forEach((exp) => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });
  
  const categoryEntries = Object.entries(categoryTotals);
  const highestCategoryEntry = categoryEntries.reduce((max, [cat, total]) => 
    total > max.total ? { category: cat, total } : max,
    { category: '', total: 0 }
  );
  
  const highestCategory = highestCategoryEntry.category ? {
    category: highestCategoryEntry.category,
    total: highestCategoryEntry.total,
    percentage: totalSpent > 0 ? (highestCategoryEntry.total / totalSpent) * 100 : 0,
  } : null;
  
  // Średnia dzienna (wielodniowy wydatek = wydatek/liczba_dni na każdy dzień)
  const uniqueDays = getDaysWithExpensePortions(expenses);
  const averageDaily = uniqueDays > 0 ? totalSpent / uniqueDays : 0;
  
  // Wydatki weekendowe vs tygodniowe
  const dayOfWeekStats = getDayOfWeekStats(expenses);
  const weekendTotal = (dayOfWeekStats['Sobota']?.total || 0) + (dayOfWeekStats['Niedziela']?.total || 0);
  const weekdayTotal = totalSpent - weekendTotal;
  
  return {
    highestDay: highestDay.total > 0 ? highestDay : null,
    highestCategory,
    averageDaily,
    weekendSpending: {
      total: weekendTotal,
      percentage: totalSpent > 0 ? (weekendTotal / totalSpent) * 100 : 0,
    },
    weekdaySpending: {
      total: weekdayTotal,
      percentage: totalSpent > 0 ? (weekdayTotal / totalSpent) * 100 : 0,
    },
  };
}

/**
 * Porównuje wydatki między dwoma okresami
 */
export function comparePeriods(
  currentExpenses: Expense[],
  previousExpenses: Expense[]
): {
  totalChange: number;
  totalChangePercentage: number;
  averageChange: number;
  averageChangePercentage: number;
  countChange: number;
  countChangePercentage: number;
} {
  const currentTotal = currentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const previousTotal = previousExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const currentAverage = currentExpenses.length > 0 ? currentTotal / currentExpenses.length : 0;
  const previousAverage = previousExpenses.length > 0 ? previousTotal / previousExpenses.length : 0;
  
  const totalChange = currentTotal - previousTotal;
  const totalChangePercentage = previousTotal > 0 ? (totalChange / previousTotal) * 100 : 0;
  
  const averageChange = currentAverage - previousAverage;
  const averageChangePercentage = previousAverage > 0 ? (averageChange / previousAverage) * 100 : 0;
  
  const countChange = currentExpenses.length - previousExpenses.length;
  const countChangePercentage = previousExpenses.length > 0 
    ? (countChange / previousExpenses.length) * 100 
    : 0;
  
  return {
    totalChange,
    totalChangePercentage,
    averageChange,
    averageChangePercentage,
    countChange,
    countChangePercentage,
  };
}

/**
 * Oblicza trend wydatków (wzrost/spadek)
 */
export function calculateTrend(expenses: Expense[]): {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  message: string;
} {
  if (expenses.length < 2) {
    return {
      direction: 'stable',
      percentage: 0,
      message: 'Za mało danych',
    };
  }
  
  const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date));
  const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
  
  const firstHalfTotal = firstHalf.reduce((sum, exp) => sum + exp.amount, 0);
  const secondHalfTotal = secondHalf.reduce((sum, exp) => sum + exp.amount, 0);
  
  const change = secondHalfTotal - firstHalfTotal;
  const percentage = firstHalfTotal > 0 ? (change / firstHalfTotal) * 100 : 0;
  
  let direction: 'up' | 'down' | 'stable' = 'stable';
  if (Math.abs(percentage) < 5) {
    direction = 'stable';
  } else if (percentage > 0) {
    direction = 'up';
  } else {
    direction = 'down';
  }
  
  const message = direction === 'up' 
    ? `Wzrost o ${Math.abs(percentage).toFixed(1)}%`
    : direction === 'down'
    ? `Spadek o ${Math.abs(percentage).toFixed(1)}%`
    : 'Stabilne wydatki';
  
  return {
    direction,
    percentage: Math.abs(percentage),
    message,
  };
}

/**
 * Pobiera wydatki z określonego okresu
 */
export function getExpensesInPeriod(
  expenses: Expense[],
  startDate: string,
  endDate: string
): Expense[] {
  return expenses.filter((exp) => {
    return exp.date >= startDate && exp.date <= endDate;
  });
}

/**
 * Pobiera wydatki z ostatnich N dni
 */
export function getExpensesLastNDays(expenses: Expense[], days: number): Expense[] {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = today.toISOString().split('T')[0];
  
  return getExpensesInPeriod(expenses, startDateStr, endDateStr);
}

/**
 * Pobiera wydatki z tego tygodnia (poniedziałek-dzisiaj)
 */
export function getExpensesThisWeek(expenses: Expense[]): Expense[] {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  
  const startDateStr = monday.toISOString().split('T')[0];
  const endDateStr = today.toISOString().split('T')[0];
  
  return getExpensesInPeriod(expenses, startDateStr, endDateStr);
}

/**
 * Pobiera wydatki z poprzedniego tygodnia
 */
export function getExpensesPreviousWeek(expenses: Expense[]): Expense[] {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const thisWeekMonday = new Date(today.setDate(diff));
  thisWeekMonday.setHours(0, 0, 0, 0);
  
  const previousWeekMonday = new Date(thisWeekMonday);
  previousWeekMonday.setDate(thisWeekMonday.getDate() - 7);
  
  const previousWeekSunday = new Date(thisWeekMonday);
  previousWeekSunday.setDate(thisWeekMonday.getDate() - 1);
  previousWeekSunday.setHours(23, 59, 59, 999);
  
  const startDateStr = previousWeekMonday.toISOString().split('T')[0];
  const endDateStr = previousWeekSunday.toISOString().split('T')[0];
  
  return getExpensesInPeriod(expenses, startDateStr, endDateStr);
}

/**
 * Pobiera wydatki z tego miesiąca
 */
export function getExpensesThisMonth(expenses: Expense[]): Expense[] {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  firstDay.setHours(0, 0, 0, 0);
  
  const startDateStr = firstDay.toISOString().split('T')[0];
  const endDateStr = today.toISOString().split('T')[0];
  
  return getExpensesInPeriod(expenses, startDateStr, endDateStr);
}

/**
 * Pobiera wydatki z poprzedniego miesiąca
 */
export function getExpensesPreviousMonth(expenses: Expense[]): Expense[] {
  const today = new Date();
  const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  firstDayThisMonth.setHours(0, 0, 0, 0);
  
  const lastDayPreviousMonth = new Date(firstDayThisMonth);
  lastDayPreviousMonth.setDate(0); // Ostatni dzień poprzedniego miesiąca
  lastDayPreviousMonth.setHours(23, 59, 59, 999);
  
  const firstDayPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  firstDayPreviousMonth.setHours(0, 0, 0, 0);
  
  const startDateStr = firstDayPreviousMonth.toISOString().split('T')[0];
  const endDateStr = lastDayPreviousMonth.toISOString().split('T')[0];
  
  return getExpensesInPeriod(expenses, startDateStr, endDateStr);
}
