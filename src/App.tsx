import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Menu, Users } from 'lucide-react';
import { useNutrition } from './hooks/useNutrition';
import { DateRibbon } from './components/DateRibbon';
import { StatsCards } from './components/StatsCards';
import { FoodList } from './components/FoodList';
import { ChatInput } from './components/ChatInput';
import { Drawer } from './components/Drawer';
import { StreakView } from './components/StreakView';
import { ParsedFood } from './lib/gemini';
import { GoalModal } from './components/GoalModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { AppLoader } from './components/AppLoader';
import { SessionUser } from './lib/auth';

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

function AuthGate() {
  const { user } = useAuth();
  const prevUserRef = useRef<SessionUser | null>(user); // null only on true fresh-login
  const [showLoader, setShowLoader] = useState(false);
  // activeUser tracks who is actually rendered in AppShell.
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
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function AppShell({ user }: { user: SessionUser }) {
  const {
    foods,
    goals,
    setGoals,
    profile,
    setProfile,
    selectedDate,
    setSelectedDate,
    addFood,
    removeFood,
    dailyTotals,
    dailyFoods,
  } = useNutrition(user.id);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'streak'>('dashboard');

  const handleFoodParsed = (parsedFoods: ParsedFood[]) => {
    parsedFoods.forEach((food) => addFood(food));
  };

  if (currentPage === 'streak') {
    return (
      <StreakView
        onBack={() => setCurrentPage('dashboard')}
        goals={goals}
        foods={foods}
        profile={profile}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-20 font-sans">
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigate={(page) => {
          if (page === 'streak') {
            setCurrentPage('streak');
          } else if (page === 'goals') {
            setIsGoalModalOpen(true);
          }
        }}
      />
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        goals={goals}
        onSave={setGoals}
        profile={profile}
        onSaveProfile={setProfile}
      />

      <header className="flex items-center justify-between px-6 pt-10 pb-4 mb-2 bg-[#050505] sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            className="p-1 -ml-1 text-zinc-400 hover:text-white transition-colors focus:outline-none"
            onClick={() => setIsDrawerOpen(true)}
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

        <div className="flex items-center gap-4 text-zinc-400">
          <button className="hover:text-white transition-colors"><Users className="w-6 h-6" strokeWidth={2} /></button>
          <div
            className="w-10 h-10 rounded-full bg-[#CCFF00] flex items-center justify-center text-black font-black text-sm"
            title={user.displayName}
          >
            {initialsOf(user.displayName)}
          </div>
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
