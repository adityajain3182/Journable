import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Menu, Zap } from 'lucide-react';
import { useNutrition } from './hooks/useNutrition';
import { DateRibbon } from './components/DateRibbon';
import { StatsCards } from './components/StatsCards';
import { FoodList } from './components/FoodList';
import { ChatInput } from './components/ChatInput';
import { Drawer } from './components/Drawer';
import { ParsedFood } from './lib/gemini';
import { GoalModal } from './components/GoalModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { AppLoader } from './components/AppLoader';
import { SessionUser } from './lib/auth';
import { useNav } from './navigation/useNav';
import { getPageComponent, PageProps } from './navigation/routes';
import { currentStreak } from './lib/streak';

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

function AuthGate() {
  const { user } = useAuth();
  const prevUserRef = useRef<SessionUser | null>(user);
  const [showLoader, setShowLoader] = useState(false);
  // Initialised to `user` so page-reloads with a valid session skip the loader.
  const [activeUser, setActiveUser] = useState<SessionUser | null>(user);

  useEffect(() => {
    const prev = prevUserRef.current;
    prevUserRef.current = user;

    if (user && !prev) {
      // Fresh login / signup — show the loader before entering the app.
      setShowLoader(true);
      const t = setTimeout(() => {
        setShowLoader(false);
        setActiveUser(user);
      }, 2600);
      return () => clearTimeout(t);
    }

    if (!user) {
      setActiveUser(null);
    }
  }, [user]);

  if (showLoader) return <AppLoader />;
  if (!activeUser) return <AuthScreen />;
  // key ensures all per-user state is fully reset on account switch.
  return <AppShell key={activeUser.id} user={activeUser} />;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function AppShell({ user }: { user: SessionUser }) {
  const nutrition = useNutrition(user.id);
  const nav = useNav();

  const {
    foods, goals, setGoals, profile, setProfile,
    selectedDate, setSelectedDate, addFood, removeFood,
    dailyTotals, dailyFoods,
    waterEntries,  addWaterEntry,  removeWaterEntry,
    weightEntries, addWeightEntry, removeWeightEntry,
    photo, setPhoto,
  } = nutrition;

  // Live current streak — recomputed on every food change because `foods`
  // is a state value. Same helper that powers the weekly summary page.
  const streak = currentStreak(foods);

  // Build the standard props bag once — every registered page receives this.
  const pageProps: PageProps = {
    onBack: nav.goBack,
    userId: user.id,
    goals, setGoals,
    foods,
    profile, setProfile,
    waterEntries,  addWaterEntry,  removeWaterEntry,
    weightEntries, addWeightEntry, removeWeightEntry,
    photo, setPhoto,
  };

  // If a registered full-page view is active, render it exclusively.
  const ActivePage = getPageComponent(nav.currentPage);
  if (ActivePage) {
    return <ActivePage {...pageProps} />;
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const handleFoodParsed = (parsedFoods: ParsedFood[]) => {
    parsedFoods.forEach((food) => addFood(food));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-20 font-sans">
      <Drawer
        isOpen={nav.isDrawerOpen}
        onClose={nav.closeDrawer}
        onNavigate={nav.navigate}
      />
      <GoalModal
        isOpen={nav.openModal === 'goals'}
        onClose={nav.closeModal}
        goals={goals}
        onSave={setGoals}
        profile={profile}
        onSaveProfile={setProfile}
      />

      <header className="flex items-center justify-between px-6 pt-10 pb-4 mb-2 bg-[#050505] sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            className="p-1 -ml-1 text-zinc-400 hover:text-white transition-colors focus:outline-none"
            onClick={nav.openDrawer}
          >
            <Menu className="w-7 h-7" strokeWidth={2} />
          </button>
          <div className="flex flex-col cursor-pointer">
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">
              {format(selectedDate, 'EEEE, MMM d')}
            </p>
            <div className="flex items-center gap-1">
              <h1 className="text-2xl font-bold italic tracking-tighter text-white uppercase">
                Journable
              </h1>
              <svg className="w-4 h-4 text-[#CCFF00] mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-zinc-400">
          {/* Streak chip — taps through to the weekly summary, computed from
              the same shared helper so it can never drift from that page. */}
          <button
            onClick={() => nav.navigate('streak')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 hover:bg-[#CCFF00]/15 transition-colors focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/40"
            title={`${streak}-day streak — open weekly summary`}
            aria-label={`${streak} day streak`}
          >
            <Zap className="w-3.5 h-3.5 text-[#CCFF00]" fill="#CCFF00" strokeWidth={2} />
            <span className="text-[#CCFF00] text-sm font-black tabular-nums leading-none">
              {streak}
            </span>
          </button>
          <button
            onClick={() => nav.navigate('profile')}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm overflow-hidden hover:scale-105 active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/40 ${photo ? 'bg-zinc-800' : 'bg-[#CCFF00] text-black font-black'}`}
            title={`${user.displayName} — open profile`}
            aria-label="Open profile"
          >
            {photo
              ? <img src={photo} alt="" className="w-full h-full object-cover" />
              : initialsOf(user.displayName)}
          </button>
        </div>
      </header>

      <main>
        <DateRibbon selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        <StatsCards totals={dailyTotals} goals={goals} />
        <FoodList foods={dailyFoods} totals={dailyTotals} goals={goals} onRemove={removeFood} />
      </main>

      <ChatInput onFoodParsed={handleFoodParsed} />
    </div>
  );
}
