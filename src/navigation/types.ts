// Navigation types — kept in their own file to avoid circular imports.
// Components and routes.ts both import from here; routes.ts then registers
// components without creating a cycle (components → types → done).

import React from 'react';
import { Goal, FoodItem, WaterEntry, WeightEntry } from '../hooks/useNutrition';
import { UserProfile } from '../lib/gemini';

// ─── Standard prop contract for every full-page view ─────────────────────────
//
// AppShell builds one PageProps object and hands it to whichever page is
// active. Each page uses only the fields it needs — extra ones are ignored.
// When a new page needs data that isn't here yet, add it once to PageProps
// and AppShell — no other file changes required.
//
export interface PageProps {
  onBack: () => void;
  userId: string;

  // Nutrition
  goals: Goal;
  setGoals: (g: Goal) => void;
  foods: FoodItem[];
  profile: UserProfile | null;
  setProfile: (p: UserProfile | null) => void;

  // Water
  waterEntries: WaterEntry[];
  addWaterEntry: (input: { amount: number; dateString: string }) => void;
  removeWaterEntry: (id: string) => void;

  // Weight
  weightEntries: WeightEntry[];
  addWeightEntry: (input: { weight: number; unit: 'kg' | 'lbs'; dateString: string }) => void;
  removeWeightEntry: (id: string) => void;
}

// ─── Modal identifiers ────────────────────────────────────────────────────────

export type ModalId = 'goals';

// ─── Route entries ────────────────────────────────────────────────────────────

export type PageEntry = {
  kind: 'page';
  id: string;
  component: React.ComponentType<PageProps>;
};

export type ModalEntry = {
  kind: 'modal';
  id: string;
  modal: ModalId;
};

export type RouteEntry = PageEntry | ModalEntry;
