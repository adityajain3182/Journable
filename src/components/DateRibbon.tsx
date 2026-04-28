import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

interface DateRibbonProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function DateRibbon({ selectedDate, onSelectDate }: DateRibbonProps) {
  // Generate a week of dates around the selected date, or just the whole week
  const start = startOfWeek(selectedDate, { weekStartsOn: 6 }); // Starts on Saturday based on screenshot (Sat 18, Sun 19)
  
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(start, i));

  return (
    <div className="flex flex-col mb-4">
      <div className="flex w-full overflow-x-auto hide-scrollbar gap-2 px-4 pb-2">
        {weekDays.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          
          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelectDate(date)}
              className={clsx(
                "flex flex-col items-center justify-center w-14 h-[4.5rem] rounded-[1.25rem] py-2 shrink-0 transition-all duration-200 border",
                isSelected
                  ? "bg-[#CCFF00] border-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]"
                  : "bg-[#1A1A1A] border-zinc-800 hover:bg-[#222] text-zinc-400"
              )}
            >
              <span className={clsx("text-[10px] font-bold uppercase tracking-widest mb-1", isSelected ? "text-black/80" : "text-zinc-500")}>
                {format(date, "E")}
              </span>
              <span className={clsx("text-xl font-black italic tracking-tighter", isSelected ? "text-black" : "text-white")}>
                {format(date, "d")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
