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
  };
}
