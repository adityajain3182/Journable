import React from 'react';
import { Goal, FoodItem } from '../hooks/useNutrition';
import { UserProfile } from '../lib/gemini';
import { StreakView } from '../components/StreakView';

// ─── Standard prop contract for every full-page view ─────────────────────────
//
// AppShell builds one PageProps object and hands it to whichever page is
// active. Each page uses only the fields it needs — extra ones are ignored.
// When a new page needs data that isn't here yet, add it once to PageProps
// and AppShell; no other file changes required.
//
export interface PageProps {
  onBack: () => void;
  userId: string;
  goals: Goal;
  setGoals: (g: Goal) => void;
  foods: FoodItem[];
  profile: UserProfile | null;
  setProfile: (p: UserProfile | null) => void;
}

// ─── Modal identifiers ────────────────────────────────────────────────────────

export type ModalId = 'goals';

// ─── Route entries ────────────────────────────────────────────────────────────

type PageEntry = {
  kind: 'page';
  id: string;
  component: React.ComponentType<PageProps>;
};

type ModalEntry = {
  kind: 'modal';
  id: string;
  modal: ModalId;
};

export type RouteEntry = PageEntry | ModalEntry;

// ─── Registry ─────────────────────────────────────────────────────────────────
//
// To add a new page:
//   1. Create the component in src/components/ (or src/pages/) implementing PageProps
//   2. Import it here and add one entry below
//   3. That's it — AppShell and Drawer need no changes
//
// To add a new modal:
//   1. Add its id to ModalId above
//   2. Add a { kind: 'modal', id: '...', modal: '<id>' } entry below
//   3. Render it in AppShell's modal section (one-time addition per modal type)
//
export const ROUTES: RouteEntry[] = [
  // ── Pages ────────────────────────────────────────────────────────────────
  { kind: 'page', id: 'streak',    component: StreakView },
  // { kind: 'page', id: 'water',   component: WaterTrackerView },
  // { kind: 'page', id: 'weight',  component: WeightTrackerView },
  // { kind: 'page', id: 'reminders', component: RemindersView },
  // { kind: 'page', id: 'groups',  component: GroupsView },

  // ── Modals ───────────────────────────────────────────────────────────────
  { kind: 'modal', id: 'goals', modal: 'goals' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getPageComponent(id: string): React.ComponentType<PageProps> | null {
  const entry = ROUTES.find((r) => r.id === id);
  if (!entry || entry.kind !== 'page') return null;
  return entry.component;
}

export function getModalForRoute(id: string): ModalId | null {
  const entry = ROUTES.find((r) => r.id === id);
  if (!entry || entry.kind !== 'modal') return null;
  return entry.modal;
}
