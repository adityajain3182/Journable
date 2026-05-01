import React, { useRef, useState } from "react";

interface OTPInputProps {
  length?: number;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OTPInput({ length = 6, onChange, disabled }: OTPInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const commit = (next: string[]) => {
    setDigits(next);
    onChange(next.join(""));
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = val;
    commit(next);
    if (val && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      commit(next);
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    const next = Array(length).fill("");
    pasted.split("").forEach((ch, i) => (next[i] = ch));
    commit(next);
    const focusIdx = Math.min(pasted.length, length - 1);
    refs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex gap-2.5 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-11 h-13 text-center text-xl font-black bg-[#1A1A1A] border border-zinc-700 rounded-xl text-white focus:border-[#CCFF00]/70 focus:outline-none transition-colors disabled:opacity-50 caret-transparent"
        />
      ))}
    </div>
  );
}
