import { useEffect, useState } from "react";
import { format, startOfToday } from "date-fns";

import { UserProfile } from "../lib/gemini";
import { readUserJson, writeUserJson } from "../lib/storage";

export type FoodItem = {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  timestamp: string;
  dateString: string;
};

export type Goal = {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
};

export type WaterEntry = {
  id: string;
  amount: number; // milliliters
export type WeightEntry = {
  id: string;
  weight: number;
  unit: 'kg' | 'lbs';
  dateString: string;
  timestamp: string;
};

const DEFAULT_GOAL: Goal = {
  calories: 2222,
  carbs: 255,
  protein: 96,
  fat: 71,
};

export function useNutrition(userId: string) {
  const [foods, setFoods] = useState<FoodItem[]>(() =>
    readUserJson<FoodItem[]>(userId, "foods", [])
  );
  const [goals, setGoals] = useState<Goal>(() =>
    readUserJson<Goal>(userId, "goals", DEFAULT_GOAL)
  );
  const [profile, setProfile] = useState<UserProfile | null>(() =>
    readUserJson<UserProfile | null>(userId, "profile", null)
  );
// IDs used by the original mock seed; purged on load so existing users
// don't keep seeing the sample entries after upgrading.
const LEGACY_MOCK_IDS = new Set(["1", "2", "3", "4", "5"]);

const loadStoredFoods = (): FoodItem[] => {
  const saved = localStorage.getItem("nutrition_foods");
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved) as FoodItem[];
    return parsed.filter((f) => !LEGACY_MOCK_IDS.has(f.id));
  } catch {
    return [];
  }
};


export function useNutrition() {
  const [foods, setFoods] = useState<FoodItem[]>(loadStoredFoods);

  const [goals, setGoals] = useState<Goal>(() => {
    const saved = localStorage.getItem("nutrition_goals");
    if (saved) return JSON.parse(saved);
    return DEFAULT_GOAL;
  });

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("nutrition_profile");
    if (saved) return JSON.parse(saved);
    return null;
  });

  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>(() => {
    const saved = localStorage.getItem("nutrition_water");
    if (!saved) return [];
    try {
      return JSON.parse(saved) as WaterEntry[];
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>(() => {
    const saved = localStorage.getItem("nutrition_weights");
    if (!saved) return [];
    try {
      return JSON.parse(saved) as WeightEntry[];
    } catch {
      return [];
    }
  });

  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());

  // The owning component is keyed by userId, so this hook is freshly mounted
  // per user — userId is stable for the hook's lifetime.
  useEffect(() => {
    writeUserJson(userId, "foods", foods);
  }, [userId, foods]);

  useEffect(() => {
    writeUserJson(userId, "goals", goals);
  }, [userId, goals]);

  useEffect(() => {
    writeUserJson(userId, "profile", profile);
  }, [userId, profile]);

  useEffect(() => {
    localStorage.setItem("nutrition_water", JSON.stringify(waterEntries));
  }, [waterEntries]);
    localStorage.setItem("nutrition_weights", JSON.stringify(weightEntries));
  }, [weightEntries]);

  const addFood = (item: Omit<FoodItem, "id" | "timestamp" | "dateString">) => {
    const now = new Date();
    const newFood: FoodItem = {
      ...item,
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${now.getTime()}-${Math.random().toString(36).slice(2, 10)}`,
      timestamp: now.toISOString(),
      dateString: format(selectedDate, "yyyy-MM-dd"),
    };
    setFoods((prev) => [newFood, ...prev]);
  };

  const removeFood = (id: string) => {
    setFoods((prev) => prev.filter((f) => f.id !== id));
  };

  const addWaterEntry = (input: { amount: number; dateString: string }) => {
    const now = new Date();
    const newEntry: WaterEntry = {
  const addWeightEntry = (input: { weight: number; unit: 'kg' | 'lbs'; dateString: string }) => {
    const now = new Date();
    const newEntry: WeightEntry = {
      ...input,
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${now.getTime()}-${Math.random().toString(36).slice(2, 10)}`,
      timestamp: now.toISOString(),
    };
    setWaterEntries((prev) => [newEntry, ...prev]);
  };

  const removeWaterEntry = (id: string) => {
    setWaterEntries((prev) => prev.filter((e) => e.id !== id));
    // One entry per date: replace any existing entry on the same dateString.
    setWeightEntries((prev) => [
      newEntry,
      ...prev.filter((e) => e.dateString !== input.dateString),
    ]);
  };

  const removeWeightEntry = (id: string) => {
    setWeightEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const dailyFoods = foods.filter((f) => f.dateString === dateStr);

  const dailyTotals = dailyFoods.reduce(
    (acc, curr) => ({
      calories: acc.calories + curr.calories,
      carbs: acc.carbs + curr.carbs,
      protein: acc.protein + curr.protein,
      fat: acc.fat + curr.fat,
    }),
    { calories: 0, carbs: 0, protein: 0, fat: 0 }
  );

  return {
    foods,
    goals,
    setGoals,
    profile,
    setProfile,
    selectedDate,
    setSelectedDate,
    addFood,
    removeFood,
    dailyFoods,
    dailyTotals,
    waterEntries,
    addWaterEntry,
    removeWaterEntry,
    weightEntries,
    addWeightEntry,
    removeWeightEntry,
  };
}
