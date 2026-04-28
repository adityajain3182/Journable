import React from 'react';
import { ArrowLeft, BarChart2 } from 'lucide-react';
import { Goal } from '../hooks/useNutrition';

interface StreakViewProps {
  onBack: () => void;
  goals: Goal;
  totals: Goal;
}

export function StreakView({ onBack, goals, totals }: StreakViewProps) {
  // Mock data for the view
  const currentStreak = 5;
  const longestStreak = 5;
  const calsUnderBudget = 2622;
  const averageCalories = 998;
  const currentWeight = 78;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 pt-10 pb-4 mb-2 sticky top-0 z-10 bg-[#050505]">
        <button className="p-1 -ml-1 text-zinc-500 hover:text-white transition-colors" onClick={onBack}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col">
           <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Progress</span>
           <h1 className="text-xl font-bold italic tracking-tighter text-white uppercase">Streak</h1>
        </div>
      </header>

      <div className="p-6 space-y-4">
        {/* Logged Days Card */}
        <div className="bg-[#1A1A1A] rounded-[2rem] p-6 border border-zinc-800 flex flex-col items-center">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Logged Days</h2>
          <div className="flex w-full">
            <div className="flex-1 flex flex-col items-center border-r border-zinc-800">
               <span className="text-5xl font-black italic tracking-tighter text-[#CCFF00] mb-2">{currentStreak}</span>
               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center flex-1">Current Streak</span>
            </div>
            <div className="flex-1 flex flex-col items-center">
               <span className="text-5xl font-black italic tracking-tighter text-white mb-2">{longestStreak}</span>
               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center flex-1">Longest Streak</span>
            </div>
          </div>
        </div>

        {/* Current Week Card */}
        <div className="bg-[#1A1A1A] rounded-[2rem] p-6 border border-zinc-800 flex flex-col items-center">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Current Week</h2>
          
          <div className="flex justify-between w-full mb-8">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
              <div key={day} className="flex flex-col items-center gap-2">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{day}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border
                  ${i < 3 ? 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/20' : 
                    i === 3 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                    i < 6 ? 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/20' : 'bg-transparent text-zinc-600 border-transparent'}`}>
                  {19 + i}
                </div>
              </div>
            ))}
          </div>

          <div className="w-full border-t border-zinc-800 pt-6 pb-6 mt-2">
            <div className="flex w-full">
              <div className="flex-1 flex flex-col items-center border-r border-zinc-800 px-2">
                 <span className="text-3xl font-black italic tracking-tighter text-[#CCFF00] mb-2 break-all">{calsUnderBudget}</span>
                 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center flex-1 leading-tight">Calories Under Budget</span>
              </div>
              <div className="flex-1 flex flex-col items-center px-2">
                 <span className="text-3xl font-black italic tracking-tighter text-white mb-2 break-all">{averageCalories}</span>
                 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center flex-1 leading-tight">Average Calories</span>
              </div>
            </div>
          </div>

          <div className="w-full border-t border-zinc-800 pt-6 text-center">
            <span className="text-3xl font-black italic tracking-tighter text-white break-all">{currentWeight}<span className="text-lg text-zinc-500 font-bold ml-1">kg</span></span>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 mb-6">Current Weight</div>
            
            <button className="mx-auto bg-[#222] border border-zinc-700 text-[#CCFF00] font-bold uppercase tracking-widest text-xs px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-zinc-800 transition-colors">
               <BarChart2 className="w-4 h-4" />
               View Weekly Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
