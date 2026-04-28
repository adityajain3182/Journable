import React from "react";
import { FoodItem, Goal } from "../hooks/useNutrition";
import { MoreVertical, Edit } from "lucide-react";
import clsx from "clsx";

interface FoodListProps {
  foods: FoodItem[];
  totals: Goal;
  goals: Goal;
  onRemove: (id: string) => void;
}

export function FoodList({ foods, totals, goals, onRemove }: FoodListProps) {
  return (
    <div className="px-6 pb-28">
      <div className="bg-[#1A1A1A] rounded-[2rem] border border-zinc-800 overflow-hidden flex flex-col gap-[1px] bg-zinc-800/50">
        {foods.map((food, index) => (
          <div
            key={food.id}
            className="p-5 bg-[#1A1A1A]"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-lg font-bold italic tracking-tight text-white">{food.name}</h4>
              <button 
                onClick={() => onRemove(food.id)}
                className="text-zinc-600 hover:text-red-500 p-1 transition-colors"
                title="Remove item"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              <span className="text-[#CCFF00]">{food.calories} kcal</span>
              <span>{food.carbs}g C</span>
              <span>{food.protein}g P</span>
              <span>{food.fat}g F</span>
            </div>
          </div>
        ))}

        {foods.length > 0 && (
          <div className="p-5 bg-[#222]">
            <div className="flex justify-between items-end mb-2">
               <div className="flex-1">
                 <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Calories</div>
                 <div className="text-2xl font-black italic tracking-tighter text-white">{totals.calories}</div>
               </div>
               <div className="flex-1">
                 <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Carbs</div>
                 <div className="text-xl font-black italic tracking-tighter text-white">{totals.carbs}g</div>
               </div>
               <div className="flex-1">
                 <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Protein</div>
                 <div className="text-xl font-black italic tracking-tighter text-white">{totals.protein}g</div>
               </div>
               <div className="flex-1">
                 <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fat</div>
                 <div className="text-xl font-black italic tracking-tighter text-white">{totals.fat}g</div>
               </div>
            </div>
            
            {/* Progress bars */}
            <div className="flex gap-2 mt-4">
              <ProgressBar current={totals.carbs} target={goals.carbs} color="bg-[#CCFF00]" />
              <ProgressBar current={totals.protein} target={goals.protein} color="bg-[#CCFF00]" />
              <ProgressBar current={totals.fat} target={goals.fat} color="bg-[#CCFF00]" />
            </div>
            
            <div className="flex justify-between items-center mt-6 text-xs font-bold text-zinc-600 uppercase">
              <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>
        )}
        
        {foods.length === 0 && (
          <div className="p-8 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs bg-[#1A1A1A]">
            No food logged today.
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ current, target, color }: { current: number, target: number, color: string }) {
  const percentage = Math.min(100, Math.round((current / target) * 100)) || 0;
  return (
    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <div className={clsx("h-full rounded-full transition-all duration-500", color)} style={{ width: `${percentage}%` }} />
    </div>
  );
}
