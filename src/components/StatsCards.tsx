import React from 'react';
import { Flame, PieChart } from 'lucide-react';
import { Goal } from '../hooks/useNutrition';

interface StatsCardsProps {
  totals: Goal;
  goals: Goal;
}

export function StatsCards({ totals, goals }: StatsCardsProps) {
  const caloriesRemaining = goals.calories - totals.calories;
  const goalRatio = goals.calories > 0 ? totals.calories / goals.calories : 0;
  const goalPercent = Math.max(0, Math.round(goalRatio * 100));
  const barPercent = Math.min(100, Math.max(0, goalRatio * 100));

  return (
    <div className="grid grid-cols-3 gap-3 px-6 mb-6">
      {/* Calories Card */}
      <div className="col-span-3 bg-[#1A1A1A] rounded-3xl p-5 border border-zinc-800 flex flex-col justify-between min-h-[140px]">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Calories Remaining</span>
          <span className="px-2 py-1 bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-bold rounded-full border border-[#CCFF00]/20 uppercase tracking-wider">
            {goalPercent}% GOAL
          </span>
        </div>
        <div className="flex items-end space-x-2 mb-4 mt-2">
          <span className="text-5xl font-black italic tracking-tighter text-white">{caloriesRemaining}</span>
          <span className="text-zinc-500 mb-2 font-bold uppercase text-xs tracking-widest">kcal left</span>
        </div>
        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-[#CCFF00] h-full transition-all duration-500" style={{ width: `${barPercent}%` }}></div>
        </div>
      </div>

      {/* Macros Cards */}
      <div className="col-span-1 bg-[#1A1A1A] rounded-3xl p-4 border border-zinc-800 flex flex-col justify-center text-center">
        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Carbs</span>
        <span className="text-xl font-black text-white">{totals.carbs}<span className="text-[10px] text-zinc-600 font-normal"> / {goals.carbs}g</span></span>
      </div>
      
      <div className="col-span-1 bg-[#1A1A1A] rounded-3xl p-4 border border-zinc-800 flex flex-col justify-center text-center">
        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Protein</span>
        <span className="text-xl font-black text-white">{totals.protein}<span className="text-[10px] text-zinc-600 font-normal"> / {goals.protein}g</span></span>
      </div>
      
      <div className="col-span-1 bg-[#1A1A1A] rounded-3xl p-4 border border-zinc-800 flex flex-col justify-center text-center">
        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Fat</span>
        <span className="text-xl font-black text-white">{totals.fat}<span className="text-[10px] text-zinc-600 font-normal"> / {goals.fat}g</span></span>
      </div>
    </div>
  );
}
