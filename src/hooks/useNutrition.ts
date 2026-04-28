import { useState, useEffect } from "react";
import { format, startOfToday } from "date-fns";

import { UserProfile } from "../lib/gemini";

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
  dateString: string;
  timestamp: string;
};

const DEFAULT_GOAL: Goal = {
  calories: 2222,
  carbs: 255,
  protein: 96,
  fat: 71,
};

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
    } catch {
      return [];
    }
  });

  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());

  useEffect(() => {
    localStorage.setItem("nutrition_foods", JSON.stringify(foods));
  }, [foods]);

  useEffect(() => {
    localStorage.setItem("nutrition_goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    if (profile) {
      localStorage.setItem("nutrition_profile", JSON.stringify(profile));
    } else {
      localStorage.removeItem("nutrition_profile");
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("nutrition_water", JSON.stringify(waterEntries));
  }, [waterEntries]);

  const addFood = (item: Omit<FoodItem, "id" | "timestamp" | "dateString">) => {
    const now = new Date();
    const newFood: FoodItem = {
      ...item,
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${now.getTime()}-${Math.random().toString(36).slice(2, 10)}`,
      timestamp: now.toISOString(),
      dateString: format(selectedDate, "yyyy-MM-dd"), // attach to currently selected date
    };
    setFoods((prev) => [newFood, ...prev]);
  };

  const removeFood = (id: string) => {
    setFoods((prev) => prev.filter((f) => f.id !== id));
  };

  const addWaterEntry = (input: { amount: number; dateString: string }) => {
    const now = new Date();
    const newEntry: WaterEntry = {
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
  };
}
