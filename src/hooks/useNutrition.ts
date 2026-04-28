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

const DEFAULT_GOAL: Goal = {
  calories: 2222,
  carbs: 255,
  protein: 96,
  fat: 71,
};

// Initial mock data simulating the screenshot
const generateMockData = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    return [
      {
        id: "1",
        name: "Paneer Rice (0.5 cup)",
        calories: 180,
        carbs: 25,
        protein: 6,
        fat: 7,
        timestamp: new Date().toISOString(),
        dateString: today,
      },
      {
        id: "2",
        name: "Lemon Soda (1 glass)",
        calories: 120,
        carbs: 30,
        protein: 0,
        fat: 0,
        timestamp: new Date().toISOString(),
        dateString: today,
      },
       {
        id: "3",
        name: "Green Tea (1 cup)",
        calories: 2,
        carbs: 0,
        protein: 0,
        fat: 0,
        timestamp: new Date().toISOString(),
        dateString: today,
      },
      {
        id: "4",
        name: "Roti (1 piece)",
        calories: 120,
        carbs: 20,
        protein: 3,
        fat: 3,
        timestamp: new Date().toISOString(),
        dateString: today,
      },
      {
        id: "5",
        name: "Aloo Gobhi Beans Sabzi (1 cup)",
        calories: 150,
        carbs: 20,
        protein: 4,
        fat: 7,
        timestamp: new Date().toISOString(),
        dateString: today,
      }
    ];
};


export function useNutrition() {
  const [foods, setFoods] = useState<FoodItem[]>(() => {
    const saved = localStorage.getItem("nutrition_foods");
    if (saved) return JSON.parse(saved);
    return generateMockData();
  });

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
    }
  }, [profile]);

  const addFood = (item: Omit<FoodItem, "id" | "timestamp" | "dateString">) => {
    const now = new Date();
    const newFood: FoodItem = {
      ...item,
      id: Math.random().toString(36).substring(7),
      timestamp: now.toISOString(),
      dateString: format(selectedDate, "yyyy-MM-dd"), // attach to currently selected date
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
