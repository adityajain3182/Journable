import { format, startOfDay, subDays, addDays, parseISO } from 'date-fns';
import { FoodItem } from '../hooks/useNutrition';

/**
 * Current logging streak — the number of consecutive days, ending today
 * (or yesterday if today is still empty), on which the user logged at
 * least one food item.
 *
 * "Yesterday-friendly" start: a streak isn't broken just because the
 * user hasn't logged breakfast yet today. The grace day rolls back to
 * the most recent day that has any entry, and counts back from there.
 */
export function currentStreak(foods: FoodItem[]): number {
  const dates = new Set<string>(foods.map((f) => f.dateString));
  if (dates.size === 0) return 0;

  let cursor = startOfDay(new Date());
  if (!dates.has(format(cursor, 'yyyy-MM-dd'))) {
    cursor = subDays(cursor, 1);
  }

  let count = 0;
  while (dates.has(format(cursor, 'yyyy-MM-dd'))) {
    count += 1;
    cursor = subDays(cursor, 1);
  }
  return count;
}

/**
 * Longest streak the user has ever recorded, across all entries.
 */
export function longestStreak(foods: FoodItem[]): number {
  const sorted = Array.from(new Set(foods.map((f) => f.dateString))).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const ds of sorted) {
    if (prev && format(addDays(parseISO(prev), 1), 'yyyy-MM-dd') === ds) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > best) best = run;
    prev = ds;
  }
  return best;
}
