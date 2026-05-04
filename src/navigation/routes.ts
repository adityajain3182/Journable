import React from 'react';
import { PageProps, ModalId, RouteEntry } from './types';
import { StreakView } from '../components/StreakView';
import { WaterTracker } from '../components/WaterTracker';
import { WeightTracker } from '../components/WeightTracker';
import { ProfilePage } from '../components/ProfilePage';

// Re-export for callers that already import from this module.
export type { PageProps, ModalId, RouteEntry } from './types';

// ─── Registry ─────────────────────────────────────────────────────────────────
//
// To add a new page:
//   1. Create the component in src/components/ implementing PageProps
//      (import PageProps from '../navigation/types', NOT from routes.ts —
//       importing from routes.ts re-introduces the circular dependency.)
//   2. Import it here and add one entry to ROUTES.
//   3. AppShell and Drawer need no changes.
//
export const ROUTES: RouteEntry[] = [
  // ── Pages ────────────────────────────────────────────────────────────────
  { kind: 'page', id: 'streak',  component: StreakView },
  { kind: 'page', id: 'water',   component: WaterTracker },
  { kind: 'page', id: 'weight',  component: WeightTracker },
  { kind: 'page', id: 'profile', component: ProfilePage },
  // { kind: 'page', id: 'reminders', component: RemindersView },
  // { kind: 'page', id: 'groups',    component: GroupsView },

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
