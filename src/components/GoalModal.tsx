import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2, Zap } from 'lucide-react';
import { Goal } from '../hooks/useNutrition';
import { UserProfile, calculateMacros } from '../lib/gemini';
import clsx from 'clsx';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal;
  onSave: (newGoals: Goal) => void;
  profile: UserProfile | null;
  onSaveProfile: (profile: UserProfile) => void;
}

export function GoalModal({ isOpen, onClose, goals, onSave, profile, onSaveProfile }: GoalModalProps) {
  const [step, setStep] = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedGoals, setCalculatedGoals] = useState<Goal | null>(null);
  
  const [wizardData, setWizardData] = useState<Partial<UserProfile>>(profile || {
    gender: undefined,
    age: undefined,
    weight: undefined,
    height: undefined,
    weightUnit: 'kg',
    heightUnit: 'cm',
    goal: undefined,
    targetWeight: undefined,
    speed: undefined
  });

  // Re-sync if profile prop changes and modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setCalculatedGoals(null);
      if (profile) setWizardData(profile);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 3 && wizardData.goal === 'maintain') {
      calculateAndSave();
    } else if (step === 5) {
      calculateAndSave();
    } else {
      setStep(prev => prev + 1);
    }
  };
  
  const handleBack = () => setStep(prev => prev - 1);

  const canProceed = () => {
    if (step === 1) {
      return !!wizardData.gender && wizardData.age !== undefined && wizardData.age >= 1 && wizardData.age <= 100;
    }
    if (step === 2) {
      const w = wizardData.weight;
      const h = wizardData.height;
      if (w === undefined || h === undefined || w <= 0 || h <= 0) return false;
      const validW = wizardData.weightUnit === 'kg' ? (w >= 20 && w <= 300) : (w >= 44 && w <= 660);
      const validH = wizardData.heightUnit === 'cm' ? (h >= 50 && h <= 300) : (h >= 1.5 && h <= 10);
      return validW && validH;
    }
    if (step === 3) return !!wizardData.goal;
    if (step === 4) {
      const tw = wizardData.targetWeight;
      const curW = wizardData.weight;
      if (tw === undefined || curW === undefined) return false;
      if (wizardData.goal === 'lose' && tw >= curW) return false; 
      if (wizardData.goal === 'gain' && tw <= curW) return false;
      return true;
    }
    if (step === 5) return !!wizardData.speed;
    return true;
  };

  const calculateAndSave = async () => {
    setIsCalculating(true);
    try {
      const fullProfile = wizardData as UserProfile;
      const newGoals = await calculateMacros(fullProfile);
      setCalculatedGoals(newGoals);
      setStep(6); // Move to results step
    } catch (e) {
      alert("Failed to calculate macros. Please try again.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleComplete = () => {
    onSaveProfile(wizardData as UserProfile);
    if (calculatedGoals) {
      onSave(calculatedGoals);
    }
    onClose();
  };

  const updateData = (updates: Partial<UserProfile>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  };

  const getTargetRecommendation = () => {
    if (!wizardData.weight) return '';
    const w = wizardData.weight;
    if (wizardData.goal === 'lose') {
       return `Recommended target: ${Math.round(w * 0.8)} - ${Math.round(w * 0.95)} ${wizardData.weightUnit}`;
    }
    if (wizardData.goal === 'gain') {
       return `Recommended target: ${Math.round(w * 1.05)} - ${Math.round(w * 1.2)} ${wizardData.weightUnit}`;
    }
    return '';
  };

  const maxSteps = wizardData.goal === 'maintain' ? 3 : 5;

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] rounded-[2rem] w-full max-w-sm p-6 shadow-2xl border border-zinc-800 flex flex-col h-[520px]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 shrink-0">
          <div className="flex items-center gap-3">
            {step > 1 && step < 6 && !isCalculating && (
              <button onClick={handleBack} className="p-1 -ml-1 text-zinc-500 hover:text-white transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">
              {step === 6 ? "Result" : `Step ${step}/${maxSteps}`}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-zinc-500 hover:text-white transition-colors" disabled={isCalculating}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto hide-scrollbar space-y-6 pt-2">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Basic Detail</h3>
                <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-widest">Help us personalize your nutrition baseline.</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Gender</label>
                <div className="flex gap-3">
                  {['male', 'female', 'other'].map(g => (
                    <button
                      key={g}
                      onClick={() => updateData({ gender: g })}
                      className={clsx(
                        "flex-1 py-3 rounded-xl border text-xs font-bold uppercase transition-colors tracking-widest",
                        wizardData.gender === g ? "bg-[#CCFF00] border-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.2)]" : "bg-[#222] border-zinc-700 text-zinc-400 hover:text-white"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Age</label>
                  <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">1 - 100 yrs</span>
                </div>
                <input 
                  type="number"
                  placeholder="e.g. 28 yrs"
                  className="w-full bg-[#222] border border-zinc-700 text-white font-bold rounded-xl px-4 py-3 outline-none focus:border-[#CCFF00] placeholder:text-zinc-600 placeholder:font-medium transition-colors"
                  value={wizardData.age || ''}
                  onChange={e => updateData({ age: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div>
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest">Measurements</h3>
                 <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-widest">Used to calculate your metabolic rate (BMR).</p>
               </div>
               <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Weight</label>
                    <div className="flex gap-2 bg-[#222] p-1 rounded-lg border border-zinc-700">
                       <button onClick={() => updateData({ weightUnit: 'kg', weight: undefined })} className={clsx("text-[9px] px-2 py-0.5 rounded uppercase font-bold transition-colors", wizardData.weightUnit === 'kg' ? 'bg-[#CCFF00] text-black' : 'text-zinc-500 hover:text-white')}>KG</button>
                       <button onClick={() => updateData({ weightUnit: 'lbs', weight: undefined })} className={clsx("text-[9px] px-2 py-0.5 rounded uppercase font-bold transition-colors", wizardData.weightUnit === 'lbs' ? 'bg-[#CCFF00] text-black' : 'text-zinc-500 hover:text-white')}>LBS</button>
                    </div>
                  </div>
                  <input 
                    type="number"
                    placeholder={wizardData.weightUnit === 'kg' ? 'e.g. 75 kg' : 'e.g. 165 lbs'}
                    className="w-full bg-[#222] border border-zinc-700 text-white font-bold rounded-xl px-4 py-3 outline-none focus:border-[#CCFF00] placeholder:text-zinc-600 placeholder:font-medium transition-colors"
                    value={wizardData.weight || ''}
                    onChange={e => updateData({ weight: e.target.value ? Number(e.target.value) : undefined })}
                  />
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-2 ml-1">
                    {wizardData.weightUnit === 'kg' ? 'Range: 20 - 300 kg' : 'Range: 44 - 660 lbs'}
                  </p>
               </div>
               <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Height</label>
                    <div className="flex gap-2 bg-[#222] p-1 rounded-lg border border-zinc-700">
                       <button onClick={() => updateData({ heightUnit: 'cm', height: undefined })} className={clsx("text-[9px] px-2 py-0.5 rounded uppercase font-bold transition-colors", wizardData.heightUnit === 'cm' ? 'bg-[#CCFF00] text-black' : 'text-zinc-500 hover:text-white')}>CM</button>
                       <button onClick={() => updateData({ heightUnit: 'ft', height: undefined })} className={clsx("text-[9px] px-2 py-0.5 rounded uppercase font-bold transition-colors", wizardData.heightUnit === 'ft' ? 'bg-[#CCFF00] text-black' : 'text-zinc-500 hover:text-white')}>FT</button>
                    </div>
                  </div>
                  <input 
                    type="number"
                    placeholder={wizardData.heightUnit === 'cm' ? 'e.g. 175 cm' : 'e.g. 5.9 ft'}
                    className="w-full bg-[#222] border border-zinc-700 text-white font-bold rounded-xl px-4 py-3 outline-none focus:border-[#CCFF00] placeholder:text-zinc-600 placeholder:font-medium transition-colors"
                    value={wizardData.height || ''}
                    onChange={e => updateData({ height: e.target.value ? Number(e.target.value) : undefined })}
                  />
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-2 ml-1">
                    {wizardData.heightUnit === 'cm' ? 'Range: 50 - 300 cm' : 'Range: 1.5 - 10 ft'}
                  </p>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Primary Goal</h3>
                <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-widest">What do you want to achieve?</p>
              </div>
              <div className="flex flex-col gap-3">
                  {[
                    { id: 'lose', label: 'Lose Weight' },
                    { id: 'maintain', label: 'Maintain Weight' },
                    { id: 'gain', label: 'Gain Weight' }
                  ].map(g => (
                    <button
                      key={g.id}
                      onClick={() => updateData({ goal: g.id as any, targetWeight: undefined, speed: undefined })}
                      className={clsx(
                        "w-full py-4 rounded-xl border text-sm font-black uppercase transition-all tracking-widest italic",
                        wizardData.goal === g.id ? "bg-[#CCFF00] border-[#CCFF00] text-black shadow-[0_0_20px_rgba(204,255,0,0.15)] scale-[1.02]" : "bg-[#222] border-zinc-700 text-zinc-400 hover:text-white"
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {step === 4 && wizardData.goal !== 'maintain' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div>
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest">Target Weight</h3>
                 <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-widest">What is your long-term goal?</p>
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Target Weight</label>
                  <input 
                    type="number"
                    placeholder={`e.g. ${wizardData.weight ? Math.round(wizardData.weight * (wizardData.goal === 'lose' ? 0.9 : 1.1)) : ''} ${wizardData.weightUnit}`}
                    className="w-full bg-[#222] border border-zinc-700 text-white font-bold rounded-xl px-4 py-3 outline-none focus:border-[#CCFF00] placeholder:text-zinc-600 placeholder:font-medium transition-colors"
                    value={wizardData.targetWeight || ''}
                    onChange={e => updateData({ targetWeight: e.target.value ? Number(e.target.value) : undefined })}
                  />
                  <div className="flex justify-between items-center mt-3 ml-1">
                    <span className="text-[9px] font-bold text-[#CCFF00] uppercase tracking-widest">
                      {getTargetRecommendation()}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                      Current: {wizardData.weight} {wizardData.weightUnit}
                    </span>
                  </div>
               </div>
            </div>
          )}

          {step === 5 && wizardData.goal !== 'maintain' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div>
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest">Pace & Speed</h3>
                 <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-widest">Set a realistic timeline for your goal.</p>
               </div>
               <div className="flex flex-col gap-3">
                   {['mild', 'moderate', 'aggressive'].map(s => {
                     const unitStr = wizardData.weightUnit || 'kg';
                     const v = unitStr === 'lbs' ? (s === 'mild' ? 0.5 : s === 'moderate' ? 1 : 2) : (s === 'mild' ? 0.25 : s === 'moderate' ? 0.5 : 1);
                     const stat = `${v} ${unitStr}/wk`;
                     const desc = s === 'mild' ? 'Light effort, easy to sustain' : s === 'moderate' ? 'Moderate exercise & discipline' : 'Strict diet & intense exercise';
                     
                     return (
                       <button
                         key={s}
                         onClick={() => updateData({ speed: s as any })}
                         className={clsx(
                           "w-full px-5 py-4 rounded-xl border text-left transition-colors",
                           wizardData.speed === s ? "bg-[#CCFF00]/10 border-[#CCFF00]" : "bg-[#222] border-zinc-700 hover:border-zinc-500"
                         )}
                       >
                         <div className="flex justify-between items-center mb-1">
                            <span className={clsx("font-bold uppercase tracking-widest text-sm", wizardData.speed === s ? "text-[#CCFF00]" : "text-zinc-300")}>{s}</span>
                            <span className={clsx("font-bold text-[11px]", wizardData.speed === s ? "text-[#CCFF00]" : "text-zinc-500")}>{stat}</span>
                         </div>
                         <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">{desc}</p>
                       </button>
                     )
                   })}
               </div>
            </div>
          )}

          {step === 6 && calculatedGoals && (
            <div className="space-y-5 animate-in zoom-in-95 duration-300 pt-2 pb-2">
               <div className="flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(204,255,0,0.15)]">
                     <Zap className="w-6 h-6 text-[#CCFF00]" />
                  </div>
                  <h3 className="text-xl font-black italic tracking-tighter text-white uppercase">Plan Generated</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Optimized daily target for your goal</p>
               </div>

               <div className="flex flex-col gap-3">
                   <div className="bg-[#222] p-5 rounded-3xl border border-zinc-700 text-center relative overflow-hidden">
                       <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest relative z-10">Daily Calories</div>
                       <div className="text-5xl font-black italic tracking-tighter text-[#CCFF00] mt-1 relative z-10">{calculatedGoals.calories} <span className="text-base text-zinc-600 font-bold uppercase not-italic tracking-widest">kcal</span></div>
                       <div className="absolute inset-0 bg-gradient-to-t from-[#CCFF00]/5 to-transparent"></div>
                   </div>
                   <div className="grid grid-cols-3 gap-3">
                       <div className="bg-[#222] p-4 rounded-2xl border border-zinc-700 text-center">
                            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Carbs</div>
                            <div className="text-xl font-black text-white">{calculatedGoals.carbs}g</div>
                       </div>
                       <div className="bg-[#222] p-4 rounded-2xl border border-zinc-700 text-center">
                            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Protein</div>
                            <div className="text-xl font-black text-white">{calculatedGoals.protein}g</div>
                       </div>
                       <div className="bg-[#222] p-4 rounded-2xl border border-zinc-700 text-center">
                            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Fat</div>
                            <div className="text-xl font-black text-white">{calculatedGoals.fat}g</div>
                       </div>
                   </div>
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-zinc-800 shrink-0">
             <button 
               className={clsx(
                 "w-full py-4 rounded-xl font-black italic tracking-tighter transition-all uppercase flex justify-center items-center gap-2",
                 !canProceed() 
                   ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" 
                   : "bg-[#CCFF00] hover:bg-[#b3ff00] text-black shadow-[0_0_20px_rgba(204,255,0,0.15)]"
               )}
               onClick={() => {
                  if (step === 6) handleComplete();
                  else handleNext();
               }}
               disabled={!canProceed() || isCalculating}
             >
               {isCalculating ? (
                 <>
                   <Loader2 className="w-5 h-5 animate-spin" />
                   Analyzing Profile...
                 </>
               ) : step === 6 ? (
                 <>Lessgoo ⚡</>
               ) : step === 5 || (step === 3 && wizardData.goal === 'maintain') ? (
                 <>Generate AI Plan</>
               ) : (
                 <>
                   Next step
                   <ChevronRight className="w-5 h-5" />
                 </>
               )}
             </button>
        </div>
      </div>
    </div>
  );
}
