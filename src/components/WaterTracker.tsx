import React, { useMemo, useState } from 'react';
import { ArrowLeft, Trash2, Droplet, Lightbulb } from 'lucide-react';
import { format, parseISO, startOfDay, addDays, getDayOfYear } from 'date-fns';
import clsx from 'clsx';
import { WaterEntry } from '../hooks/useNutrition';
import { UserProfile } from '../lib/gemini';
import { PageProps } from '../navigation/types';

const HYDRATION_FACTS = [
  "About 60% of an adult's body weight is water.",
  "The human brain is roughly 73% water — even mild dehydration affects focus.",
  "Losing just 1–2% of your body water can measurably reduce mood and concentration.",
  "Drinking a glass of water 30 minutes before a meal can help with portion control.",
  "Coffee and tea contribute to daily hydration despite their caffeine content.",
  "By the time you feel thirsty, you're already mildly dehydrated.",
  "Cold water requires energy to warm to body temperature — a small metabolic boost.",
  "Healthy kidneys can process up to about 1 liter of water per hour.",
  "Cucumbers and watermelon are over 95% water.",
  "Hydration helps regulate body temperature through sweat and respiration.",
  "Water lubricates joints and cushions the spinal cord.",
  "Adequate hydration supports skin elasticity and complexion.",
  "Athletes can lose 1–2 liters of water per hour in intense exercise.",
  "Water transports nutrients and oxygen through the bloodstream.",
  "Most adults need ~30–35 ml of water per kg of body weight daily.",
  "Drinking water can temporarily raise resting metabolism by 10–30%.",
  "Hydration plays a role in preventing kidney stones and constipation.",
  "Plain water is calorie-free — a strong substitute for sugary drinks.",
  "Even slight dehydration is a common trigger for headaches.",
  "Pregnancy and breastfeeding meaningfully increase daily water needs.",
  "Bones are about 31% water by weight.",
  "Drinking water helps the body flush waste through urine and sweat.",
  "Electrolytes like sodium and potassium help your cells absorb water.",
  "Sipping water steadily hydrates better than chugging large amounts at once.",
  "High-fiber foods need extra water to move efficiently through digestion.",
];

function recommendedIntakeMl(profile: UserProfile | null): number {
  // Base: 35 ml/kg of body weight (a common adult guideline).
  // Lose / gain goals add a small bump for satiety / muscle synthesis.
  if (!profile?.weight) return 2500;
  const kg = profile.weightUnit === 'lbs' ? profile.weight / 2.20462 : profile.weight;
  let ml = kg * 35;
  if (profile.goal === 'lose' || profile.goal === 'gain') ml += 250;
  // Round to nearest 100 ml so the goal reads cleanly.
  return Math.max(1500, Math.round(ml / 100) * 100);
}

function getDailyFacts(today: Date): [string, string] {
  const day = getDayOfYear(today);
  const a = HYDRATION_FACTS[(day * 2) % HYDRATION_FACTS.length];
  const b = HYDRATION_FACTS[(day * 2 + 1) % HYDRATION_FACTS.length];
  return [a, b];
}

const QUICK_AMOUNTS: { label: string; ml: number }[] = [
  { label: 'Glass', ml: 250 },
  { label: 'Bottle', ml: 500 },
  { label: 'Large', ml: 750 },
];

export function WaterTracker({
  onBack,
  profile,
  waterEntries: entries,
  addWaterEntry: onAdd,
  removeWaterEntry: onRemove,
}: PageProps) {
  const today = startOfDay(new Date());
  const todayStr = format(today, 'yyyy-MM-dd');
  const dailyGoal = recommendedIntakeMl(profile);

  const byDate = useMemo(() => {
    const map = new Map<string, WaterEntry[]>();
    for (const e of entries) {
      const arr = map.get(e.dateString);
      if (arr) arr.push(e);
      else map.set(e.dateString, [e]);
    }
    return map;
  }, [entries]);

  const todayEntries = useMemo(
    () => (byDate.get(todayStr) ?? []).slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [byDate, todayStr],
  );
  const todayTotal = todayEntries.reduce((s, e) => s + e.amount, 0);
  const todayPct = dailyGoal > 0 ? Math.min(100, Math.round((todayTotal / dailyGoal) * 100)) : 0;

  const dateStrip = useMemo(() => {
    const days: {
      date: Date;
      ds: string;
      total: number;
      isToday: boolean;
      isFuture: boolean;
      metGoal: boolean;
      logged: boolean;
    }[] = [];
    for (let i = -4; i <= 2; i++) {
      const d = addDays(today, i);
      const ds = format(d, 'yyyy-MM-dd');
      const total = (byDate.get(ds) ?? []).reduce((s, e) => s + e.amount, 0);
      days.push({
        date: d,
        ds,
        total,
        isToday: i === 0,
        isFuture: i > 0,
        metGoal: total >= dailyGoal,
        logged: total > 0,
      });
    }
    return days;
  }, [today, byDate, dailyGoal]);

  const [factA, factB] = useMemo(() => getDailyFacts(today), [todayStr]);
  const [customAmount, setCustomAmount] = useState('');

  const addAmount = (ml: number) => {
    if (!Number.isFinite(ml) || ml <= 0) return;
    if (ml > 5000) {
      alert('Per-entry max is 5000 ml.');
      return;
    }
    onAdd({ amount: Math.round(ml), dateString: todayStr });
  };

  const submitCustom = () => {
    const ml = Number(customAmount);
    if (!Number.isFinite(ml) || ml <= 0) {
      alert('Enter a valid amount in ml.');
      return;
    }
    addAmount(ml);
    setCustomAmount('');
  };

  // Ring chart geometry
  const ringSize = 200;
  const ringStroke = 14;
  const radius = (ringSize - ringStroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(1, dailyGoal > 0 ? todayTotal / dailyGoal : 0));

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-12">
      <header className="flex items-center gap-4 px-6 pt-10 pb-4 mb-2 sticky top-0 z-10 bg-[#050505]">
        <button className="p-1 -ml-1 text-zinc-500 hover:text-white transition-colors" onClick={onBack}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Hydration</span>
          <h1 className="text-xl font-bold italic tracking-tighter text-white uppercase">Water Tracker</h1>
        </div>
      </header>

      <div className="px-6 space-y-4">
        {/* Today's Ring */}
        <div className="rounded-[2rem] p-6 border border-zinc-800 bg-[#1A1A1A] flex flex-col items-center">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Today</h2>
          <div className="relative" style={{ width: ringSize, height: ringSize }}>
            <svg width={ringSize} height={ringSize} className="-rotate-90">
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="#27272a"
                strokeWidth={ringStroke}
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={ringStroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black italic tracking-tighter text-white">{todayTotal}</span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">/ {dailyGoal} ml</span>
              <span className="text-xs font-bold text-blue-400 mt-1">{todayPct}%</span>
            </div>
          </div>

          <div className="flex gap-2 mt-6 w-full">
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q.ml}
                onClick={() => addAmount(q.ml)}
                className="flex-1 bg-[#222] border border-zinc-700 hover:border-blue-500 transition-colors rounded-xl px-2 py-3 flex flex-col items-center"
              >
                <Droplet className="w-4 h-4 text-blue-400 mb-1" />
                <span className="text-xs font-black italic text-white">+{q.ml}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{q.label}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2 mt-3 w-full">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Custom amount (ml)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitCustom()}
              className="flex-1 bg-[#222] border border-zinc-700 text-white font-bold rounded-xl px-4 py-3 outline-none focus:border-blue-500 placeholder:text-zinc-600"
            />
            <button
              onClick={submitCustom}
              className="bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] px-4 rounded-xl transition-colors"
            >
              Add
            </button>
          </div>

          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-4 text-center">
            {profile?.weight
              ? `Goal based on ${profile.weight} ${profile.weightUnit} body weight${
                  profile.goal === 'lose' || profile.goal === 'gain' ? ` and ${profile.goal} goal` : ''
                }`
              : 'Default goal — set your weight in Daily Goals for a personalized target'}
          </p>
        </div>

        {/* Date Strip */}
        <div className="rounded-[2rem] p-5 border border-zinc-800 bg-[#1A1A1A]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Recent Days</h3>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Goal: {dailyGoal} ml</span>
          </div>
          <div className="flex gap-2 justify-between">
            {dateStrip.map((day) => (
              <div key={day.ds} className="flex-1 flex flex-col items-center gap-1.5">
                <span
                  className={clsx(
                    'text-[9px] font-bold uppercase tracking-widest',
                    day.isToday ? 'text-blue-400' : 'text-zinc-500',
                  )}
                >
                  {format(day.date, 'EEE')}
                </span>
                <div
                  className={clsx(
                    'w-full aspect-square rounded-lg flex items-center justify-center text-sm font-black italic border-2 transition-colors',
                    day.isFuture
                      ? 'bg-transparent border-zinc-800 text-zinc-700'
                      : day.isToday
                        ? day.metGoal
                          ? 'bg-green-500/15 border-green-500 text-green-400'
                          : 'bg-blue-500/10 border-blue-500 text-blue-400'
                        : day.metGoal
                          ? 'bg-green-500/15 border-green-500/40 text-green-400'
                          : day.logged
                            ? 'bg-red-500/10 border-red-500/40 text-red-400'
                            : 'bg-[#222] border-zinc-800 text-zinc-600',
                  )}
                >
                  {format(day.date, 'd')}
                </div>
                <span
                  className={clsx(
                    'text-[9px] font-bold uppercase tracking-widest',
                    day.isToday
                      ? 'text-blue-400'
                      : day.isFuture
                        ? 'text-zinc-700'
                        : day.metGoal
                          ? 'text-green-400'
                          : day.logged
                            ? 'text-red-400'
                            : 'text-zinc-700',
                  )}
                >
                  {day.isToday
                    ? `${todayPct}%`
                    : day.isFuture
                      ? '—'
                      : day.logged
                        ? `${Math.round((day.total / dailyGoal) * 100)}%`
                        : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Facts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[factA, factB].map((fact, i) => (
            <div key={i} className="rounded-[1.5rem] p-4 border border-zinc-800 bg-[#1A1A1A] flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Did you know?</p>
                <p className="text-xs font-bold text-white leading-snug">{fact}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Today's Log */}
        <div className="rounded-[2rem] border border-zinc-800 bg-[#1A1A1A] overflow-hidden">
          <div className="p-5 pb-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Today's Log</h3>
          </div>
          {todayEntries.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs">
              Nothing logged yet today.
            </div>
          ) : (
            <div className="flex flex-col">
              {todayEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-5 border-t border-zinc-800/60 first:border-t-0"
                >
                  <div className="flex items-center gap-3">
                    <Droplet className="w-4 h-4 text-blue-400" />
                    <span className="text-base font-bold italic tracking-tight text-white">+{entry.amount} ml</span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      {format(parseISO(entry.timestamp), 'h:mm a')}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemove(entry.id)}
                    className="text-zinc-600 hover:text-red-500 p-1 transition-colors"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
