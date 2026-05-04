import React, { useMemo, useState } from 'react';
import { ArrowLeft, Plus, Trash2, TrendingDown, TrendingUp, Minus, AlertCircle, X } from 'lucide-react';
import { format, parseISO, differenceInDays, startOfDay, subDays, addDays, isAfter } from 'date-fns';
import clsx from 'clsx';
import { WeightEntry } from '../hooks/useNutrition';
import { UserProfile } from '../lib/gemini';

interface WeightTrackerProps {
  onBack: () => void;
  entries: WeightEntry[];
  profile: UserProfile | null;
  onAdd: (input: { weight: number; unit: 'kg' | 'lbs'; dateString: string }) => void;
  onRemove: (id: string) => void;
}

type Range = 'week' | 'month';

function recommendedIntervalDays(profile: UserProfile | null): number {
  // Lose / gain goals warrant tighter check-ins; maintain can be biweekly.
  if (!profile) return 7;
  return profile.goal === 'maintain' ? 14 : 7;
}

function convertWeight(value: number, from: 'kg' | 'lbs', to: 'kg' | 'lbs'): number {
  if (from === to) return value;
  return from === 'kg' ? value * 2.20462 : value / 2.20462;
}

export function WeightTracker({ onBack, entries, profile, onAdd, onRemove }: WeightTrackerProps) {
  const [range, setRange] = useState<Range>('week');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const todayStr = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const [draftWeight, setDraftWeight] = useState<string>('');
  const [draftUnit, setDraftUnit] = useState<'kg' | 'lbs'>(profile?.weightUnit ?? 'kg');
  const [draftDate, setDraftDate] = useState<string>(todayStr);

  const sortedAsc = useMemo(
    () => [...entries].sort((a, b) => a.dateString.localeCompare(b.dateString)),
    [entries],
  );
  const sortedDesc = useMemo(() => [...sortedAsc].reverse(), [sortedAsc]);
  const intervalDays = recommendedIntervalDays(profile);

  const headline = useMemo(() => {
    if (sortedAsc.length === 0) {
      return {
        kind: 'empty' as const,
        text: 'Log your first weight to start tracking your progress.',
      };
    }
    const latest = sortedAsc[sortedAsc.length - 1];
    const today = startOfDay(new Date());
    const latestDate = parseISO(latest.dateString);
    const daysSince = differenceInDays(today, latestDate);

    if (daysSince > intervalDays) {
      return {
        kind: 'overdue' as const,
        text: `You haven't recorded your weight in ${daysSince} days. Time to weigh in!`,
      };
    }

    if (sortedAsc.length === 1) {
      return {
        kind: 'first' as const,
        text: `First entry recorded: ${latest.weight} ${latest.unit}. Log again soon to track progress.`,
      };
    }

    let prior: WeightEntry | null = null;
    for (let i = sortedAsc.length - 2; i >= 0; i--) {
      const e = sortedAsc[i];
      const gap = differenceInDays(latestDate, parseISO(e.dateString));
      if (gap >= 6) {
        prior = e;
        break;
      }
    }

    let span = 'in the last week';
    if (!prior) {
      prior = sortedAsc[0];
      const gap = differenceInDays(latestDate, parseISO(prior.dateString));
      span = gap < 7 ? `over the last ${gap} day${gap === 1 ? '' : 's'}` : 'since you started';
    }

    const priorWeight = convertWeight(prior.weight, prior.unit, latest.unit);
    const delta = latest.weight - priorWeight;
    const abs = Math.abs(delta).toFixed(1);

    if (Math.abs(delta) < 0.1) {
      return {
        kind: 'steady' as const,
        text: `Your weight has held steady at ${latest.weight} ${latest.unit} ${span}.`,
      };
    }

    const direction = delta < 0 ? 'lost' : 'gained';
    return {
      kind: delta < 0 ? ('down' as const) : ('up' as const),
      text: `You ${direction} ${abs} ${latest.unit} ${span}.`,
    };
  }, [sortedAsc, intervalDays]);

  const HeadlineIcon =
    headline.kind === 'down'
      ? TrendingDown
      : headline.kind === 'up'
        ? TrendingUp
        : headline.kind === 'overdue'
          ? AlertCircle
          : Minus;

  const cadenceLabel = profile?.goal === 'maintain' ? 'every 2 weeks' : 'weekly';
  const lastLogged = sortedAsc[sortedAsc.length - 1];
  const daysSinceLatest = lastLogged
    ? differenceInDays(startOfDay(new Date()), parseISO(lastLogged.dateString))
    : null;

  const submitDraft = () => {
    const w = Number(draftWeight);
    if (!Number.isFinite(w) || w <= 0) {
      alert('Enter a valid weight.');
      return;
    }
    if (!draftDate) {
      alert('Pick a date for this entry.');
      return;
    }
    if (isAfter(parseISO(draftDate), startOfDay(new Date()))) {
      alert("You can't log weight in the future.");
      return;
    }
    onAdd({ weight: Math.round(w * 10) / 10, unit: draftUnit, dateString: draftDate });
    setDraftWeight('');
    setDraftDate(todayStr);
    setIsAddOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-12">
      <header className="flex items-center justify-between gap-4 px-6 pt-10 pb-4 mb-2 sticky top-0 z-10 bg-[#050505]">
        <div className="flex items-center gap-4">
          <button className="p-1 -ml-1 text-zinc-500 hover:text-white transition-colors" onClick={onBack}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Progress</span>
            <h1 className="text-xl font-bold italic tracking-tighter text-white uppercase">Weight Tracker</h1>
          </div>
        </div>
        <button
          onClick={() => setIsAddOpen((v) => !v)}
          className="bg-[#CCFF00] text-black font-black uppercase tracking-widest text-[10px] px-3 py-2 rounded-xl flex items-center gap-1 hover:bg-[#b3ff00] transition-colors"
        >
          {isAddOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAddOpen ? 'Close' : 'Add'}
        </button>
      </header>

      <div className="px-6 space-y-4">
        {/* Headline */}
        <div
          className={clsx(
            'rounded-[2rem] p-5 border flex items-start gap-4',
            headline.kind === 'overdue'
              ? 'bg-red-500/10 border-red-500/20'
              : headline.kind === 'down'
                ? 'bg-[#CCFF00]/5 border-[#CCFF00]/20'
                : 'bg-[#1A1A1A] border-zinc-800',
          )}
        >
          <div
            className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              headline.kind === 'overdue'
                ? 'bg-red-500/15 text-red-500'
                : headline.kind === 'down'
                  ? 'bg-[#CCFF00]/15 text-[#CCFF00]'
                  : headline.kind === 'up'
                    ? 'bg-orange-500/15 text-orange-400'
                    : 'bg-zinc-800 text-zinc-400',
            )}
          >
            <HeadlineIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-snug">{headline.text}</p>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">
              Recommended cadence: {cadenceLabel}
              {daysSinceLatest !== null && ` · last logged ${daysSinceLatest === 0 ? 'today' : `${daysSinceLatest}d ago`}`}
            </p>
          </div>
        </div>

        {/* Add Entry inline form */}
        {isAddOpen && (
          <div className="rounded-[2rem] p-5 border border-zinc-800 bg-[#1A1A1A] space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">New Entry</h3>
            <div className="flex gap-3">
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder={draftUnit === 'kg' ? 'e.g. 75.4' : 'e.g. 165.8'}
                value={draftWeight}
                onChange={(e) => setDraftWeight(e.target.value)}
                className="flex-1 bg-[#222] border border-zinc-700 text-white font-bold rounded-xl px-4 py-3 outline-none focus:border-[#CCFF00] placeholder:text-zinc-600"
              />
              <div className="flex gap-1 bg-[#222] p-1 rounded-xl border border-zinc-700">
                <button
                  onClick={() => setDraftUnit('kg')}
                  className={clsx(
                    'text-[10px] px-3 rounded-lg uppercase font-bold transition-colors',
                    draftUnit === 'kg' ? 'bg-[#CCFF00] text-black' : 'text-zinc-500 hover:text-white',
                  )}
                >
                  KG
                </button>
                <button
                  onClick={() => setDraftUnit('lbs')}
                  className={clsx(
                    'text-[10px] px-3 rounded-lg uppercase font-bold transition-colors',
                    draftUnit === 'lbs' ? 'bg-[#CCFF00] text-black' : 'text-zinc-500 hover:text-white',
                  )}
                >
                  LBS
                </button>
              </div>
            </div>
            <input
              type="date"
              value={draftDate}
              max={todayStr}
              onChange={(e) => setDraftDate(e.target.value)}
              className="w-full bg-[#222] border border-zinc-700 text-white font-bold rounded-xl px-4 py-3 outline-none focus:border-[#CCFF00]"
            />
            <button
              onClick={submitDraft}
              className="w-full bg-[#CCFF00] hover:bg-[#b3ff00] text-black font-black italic tracking-tighter uppercase py-3 rounded-xl transition-colors"
            >
              Save Entry
            </button>
          </div>
        )}

        {/* Chart */}
        <div className="rounded-[2rem] p-5 border border-zinc-800 bg-[#1A1A1A]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Trend</h3>
            <div className="flex gap-1 bg-[#222] p-1 rounded-lg border border-zinc-700">
              {(['week', 'month'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={clsx(
                    'text-[10px] px-3 py-1 rounded uppercase font-bold transition-colors tracking-widest',
                    range === r ? 'bg-[#CCFF00] text-black' : 'text-zinc-500 hover:text-white',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <WeightChart entries={sortedAsc} range={range} />
        </div>

        {/* History */}
        <div className="rounded-[2rem] border border-zinc-800 bg-[#1A1A1A] overflow-hidden">
          <div className="p-5 pb-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">History</h3>
          </div>
          {sortedDesc.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs">
              No entries yet.
            </div>
          ) : (
            <div className="flex flex-col">
              {sortedDesc.map((entry, i) => {
                const prev = sortedDesc[i + 1];
                const delta = prev ? entry.weight - convertWeight(prev.weight, prev.unit, entry.unit) : null;
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-5 border-t border-zinc-800/60 first:border-t-0"
                  >
                    <div className="flex flex-col">
                      <span className="text-base font-bold italic tracking-tight text-white">
                        {entry.weight} {entry.unit}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                        {format(parseISO(entry.dateString), 'EEE, MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {delta !== null && Math.abs(delta) >= 0.05 && (
                        <span
                          className={clsx(
                            'text-[10px] font-bold uppercase tracking-widest',
                            delta < 0 ? 'text-[#CCFF00]' : 'text-orange-400',
                          )}
                        >
                          {delta < 0 ? '−' : '+'}
                          {Math.abs(delta).toFixed(1)} {entry.unit}
                        </span>
                      )}
                      <button
                        onClick={() => onRemove(entry.id)}
                        className="text-zinc-600 hover:text-red-500 p-1 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WeightChart({ entries, range }: { entries: WeightEntry[]; range: Range }) {
  const today = startOfDay(new Date());
  const days = range === 'week' ? 7 : 30;
  const start = subDays(today, days - 1);
  const targetUnit: 'kg' | 'lbs' = entries[entries.length - 1]?.unit ?? 'kg';

  const inRange = entries
    .filter((e) => parseISO(e.dateString).getTime() >= start.getTime())
    .map((e) => ({
      date: parseISO(e.dateString),
      weight: convertWeight(e.weight, e.unit, targetUnit),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (inRange.length === 0) {
    return (
      <div className="text-zinc-500 text-xs uppercase tracking-widest text-center py-12 font-bold">
        No entries in this {range}.
      </div>
    );
  }

  const VBOX_W = 320;
  const VBOX_H = 200;
  const PAD = { top: 16, right: 12, bottom: 30, left: 36 };
  const plotW = VBOX_W - PAD.left - PAD.right;
  const plotH = VBOX_H - PAD.top - PAD.bottom;

  const minW = Math.min(...inRange.map((e) => e.weight));
  const maxW = Math.max(...inRange.map((e) => e.weight));
  // Pad the y-range so points aren't flush against the edges, even when all
  // values are equal.
  const span = maxW - minW;
  const pad = span === 0 ? Math.max(0.5, maxW * 0.02) : span * 0.2;
  const yMin = minW - pad;
  const yMax = maxW + pad;
  const yRange = yMax - yMin || 1;

  const xMin = start.getTime();
  const xMax = today.getTime();
  const xRange = xMax - xMin || 1;

  const xFor = (date: Date) => PAD.left + ((date.getTime() - xMin) / xRange) * plotW;
  const yFor = (w: number) => PAD.top + ((yMax - w) / yRange) * plotH;

  const points = inRange.map((e) => `${xFor(e.date).toFixed(1)},${yFor(e.weight).toFixed(1)}`).join(' ');

  const yTicks = [yMin, yMin + yRange / 3, yMin + (2 * yRange) / 3, yMax];
  const xTicks =
    range === 'week'
      ? Array.from({ length: 7 }).map((_, i) => addDays(start, i))
      : [start, addDays(start, Math.floor(days / 3)), addDays(start, Math.floor((2 * days) / 3)), today];

  return (
    <svg viewBox={`0 0 ${VBOX_W} ${VBOX_H}`} className="w-full h-48" preserveAspectRatio="xMidYMid meet">
      {yTicks.map((tick, i) => (
        <g key={`y-${i}`}>
          <line
            x1={PAD.left}
            x2={VBOX_W - PAD.right}
            y1={yFor(tick)}
            y2={yFor(tick)}
            stroke="#27272a"
            strokeWidth={0.5}
            strokeDasharray="2,3"
          />
          <text
            x={PAD.left - 6}
            y={yFor(tick) + 3}
            fill="#71717a"
            fontSize="9"
            textAnchor="end"
            fontWeight="700"
          >
            {tick.toFixed(1)}
          </text>
        </g>
      ))}

      {xTicks.map((date, i) => (
        <text
          key={`x-${i}`}
          x={xFor(date)}
          y={VBOX_H - PAD.bottom + 14}
          fill="#71717a"
          fontSize="9"
          textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
          fontWeight="700"
        >
          {format(date, range === 'week' ? 'EEE' : 'MMM d')}
        </text>
      ))}

      {inRange.length > 1 && (
        <polyline
          points={points}
          fill="none"
          stroke="#CCFF00"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {inRange.map((e, i) => (
        <circle
          key={`pt-${i}`}
          cx={xFor(e.date)}
          cy={yFor(e.weight)}
          r="3.5"
          fill="#CCFF00"
          stroke="#050505"
          strokeWidth="1.5"
        />
      ))}

      <text
        x={VBOX_W - PAD.right}
        y={PAD.top - 4}
        fill="#52525b"
        fontSize="8"
        textAnchor="end"
        fontWeight="700"
      >
        {targetUnit.toUpperCase()}
      </text>
    </svg>
  );
}
