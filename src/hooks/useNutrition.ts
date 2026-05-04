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
  amount: number;        // milliliters
  dateString: string;    // 'yyyy-MM-dd'
  timestamp: string;
};

export type WeightEntry = {
  id: string;
  weight: number;
  unit: "kg" | "lbs";
  dateString: string;    // 'yyyy-MM-dd'
  timestamp: string;
};

const DEFAULT_GOAL: Goal = {
  calories: 2222,
  carbs: 255,
  protein: 96,
  fat: 71,
};

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useNutrition(userId: string) {
  // ── State ─────────────────────────────────────────────────────────────────
  const [foods, setFoods] = useState<FoodItem[]>(() =>
    readUserJson<FoodItem[]>(userId, "foods", [])
  );
  const [goals, setGoals] = useState<Goal>(() =>
    readUserJson<Goal>(userId, "goals", DEFAULT_GOAL)
  );
  const [profile, setProfile] = useState<UserProfile | null>(() =>
    readUserJson<UserProfile | null>(userId, "profile", null)
  );
  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>(() =>
    readUserJson<WaterEntry[]>(userId, "water", [])
  );
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>(() =>
    readUserJson<WeightEntry[]>(userId, "weight", [])
  );
  const [photo, setPhoto] = useState<string | null>(() =>
    readUserJson<string | null>(userId, "photo", null)
  );
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());

  // ── Persistence ──────────────────────────────────────────────────────────
  // The owning component is keyed by userId, so the hook is freshly mounted
  // per user — userId is stable for this hook's lifetime.
  useEffect(() => { writeUserJson(userId, "foods",   foods);         }, [userId, foods]);
  useEffect(() => { writeUserJson(userId, "goals",   goals);         }, [userId, goals]);
  useEffect(() => { writeUserJson(userId, "profile", profile);       }, [userId, profile]);
  useEffect(() => { writeUserJson(userId, "water",   waterEntries);  }, [userId, waterEntries]);
  useEffect(() => { writeUserJson(userId, "weight",  weightEntries); }, [userId, weightEntries]);
  useEffect(() => { writeUserJson(userId, "photo",   photo);         }, [userId, photo]);

  // ── Food actions ─────────────────────────────────────────────────────────
  const addFood = (item: Omit<FoodItem, "id" | "timestamp" | "dateString">) => {
    const newFood: FoodItem = {
      ...item,
      id: makeId(),
      timestamp: new Date().toISOString(),
      dateString: format(selectedDate, "yyyy-MM-dd"),
    };
    setFoods((prev) => [newFood, ...prev]);
  };

  const removeFood = (id: string) => {
    setFoods((prev) => prev.filter((f) => f.id !== id));
  };

  // ── Water actions ────────────────────────────────────────────────────────
  const addWaterEntry = (input: { amount: number; dateString: string }) => {
    const newEntry: WaterEntry = {
      ...input,
      id: makeId(),
      timestamp: new Date().toISOString(),
    };
    setWaterEntries((prev) => [newEntry, ...prev]);
  };

  const removeWaterEntry = (id: string) => {
    setWaterEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // ── Weight actions ───────────────────────────────────────────────────────
  // One entry per day: adding to an existing date replaces that day's entry.
  const addWeightEntry = (input: { weight: number; unit: "kg" | "lbs"; dateString: string }) => {
    const newEntry: WeightEntry = {
      ...input,
      id: makeId(),
      timestamp: new Date().toISOString(),
    };
    setWeightEntries((prev) => [
      newEntry,
      ...prev.filter((e) => e.dateString !== input.dateString),
    ]);
  };

  const removeWeightEntry = (id: string) => {
    setWeightEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const dailyFoods = foods.filter((f) => f.dateString === dateStr);
  const dailyTotals = dailyFoods.reduce(
    (acc, curr) => ({
      calories: acc.calories + curr.calories,
      carbs:    acc.carbs    + curr.carbs,
      protein:  acc.protein  + curr.protein,
      fat:      acc.fat      + curr.fat,
    }),
    { calories: 0, carbs: 0, protein: 0, fat: 0 }
  );

  return {
    foods,
    goals,    setGoals,
    profile,  setProfile,
    selectedDate, setSelectedDate,
    addFood, removeFood,
    dailyFoods, dailyTotals,
    waterEntries,  addWaterEntry,  removeWaterEntry,
    weightEntries, addWeightEntry, removeWeightEntry,
    photo, setPhoto,
  };
}
