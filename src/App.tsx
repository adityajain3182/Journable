import React, { useState } from 'react';
import { format } from 'date-fns';
import { Menu, Users, Zap, Share2 } from 'lucide-react';
import { useNutrition } from './hooks/useNutrition';
import { DateRibbon } from './components/DateRibbon';
import { StatsCards } from './components/StatsCards';
import { FoodList } from './components/FoodList';
import { ChatInput } from './components/ChatInput';
import { Drawer } from './components/Drawer';
import { StreakView } from './components/StreakView';
import { WaterTracker } from './components/WaterTracker';
import { ParsedFood } from './lib/gemini';
import { GoalModal } from './components/GoalModal';

export default function App() {
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
    waterEntries,
    addWaterEntry,
    removeWaterEntry,
  } = useNutrition();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'streak' | 'water'>('dashboard');

  const handleFoodParsed = (parsedFoods: ParsedFood[]) => {
    parsedFoods.forEach(food => {
      addFood(food);
    });
  };

  if (currentPage === 'streak') {
    return <StreakView onBack={() => setCurrentPage('dashboard')} goals={goals} foods={foods} profile={profile} />;
  }

  if (currentPage === 'water') {
    return (
      <WaterTracker
        onBack={() => setCurrentPage('dashboard')}
        entries={waterEntries}
        profile={profile}
        onAdd={addWaterEntry}
        onRemove={removeWaterEntry}
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
          } else if (page === 'water') {
            setCurrentPage('water');
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
      
      {/* Header */}
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
          <div className="w-10 h-10 rounded-full bg-[#CCFF00] flex items-center justify-center text-black font-black text-lg">
            JD
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <DateRibbon 
          selectedDate={selectedDate} 
          onSelectDate={setSelectedDate} 
        />
        
        <StatsCards totals={dailyTotals} goals={goals} />
        
        <FoodList 
          foods={dailyFoods} 
          totals={dailyTotals} 
          goals={goals} 
          onRemove={removeFood}
        />
      </main>

      {/* Input Area */}
      <ChatInput onFoodParsed={handleFoodParsed} />
    </div>
  );
}
