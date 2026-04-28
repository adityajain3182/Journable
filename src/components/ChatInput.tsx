import React, { useRef, useState } from "react";
import { Camera, Image as ImageIcon, Bookmark, Loader2, Send } from "lucide-react";
import { parseFoodInput, ParsedFood } from "../lib/gemini";
import clsx from "clsx";

interface ChatInputProps {
  onFoodParsed: (foods: ParsedFood[]) => void;
}

export function ChatInput({ onFoodParsed }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const parsed = await parseFoodInput(input);
      onFoodParsed(parsed);
      setInput("");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to analyze text.";
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const parsed = await parseFoodInput(undefined, file);
      onFoodParsed(parsed);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to analyze image.";
      alert(msg);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/90 backdrop-blur-md border-t border-zinc-800 p-4 pb-safe flex gap-3 flex-col shadow-lg z-20">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />
      
      <div className="w-full bg-[#222] rounded-3xl border border-zinc-700 flex items-center justify-between p-2">
        <div className="flex-1 flex items-center space-x-3">
          <div 
            className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center cursor-pointer shrink-0 hover:bg-zinc-700 transition"
            onClick={() => fileInputRef.current?.click()}
          >
            {isLoading ? <Loader2 className="w-5 h-5 text-[#CCFF00] animate-spin" /> : <ImageIcon className="w-5 h-5 text-[#CCFF00]" />}
          </div>
          <div className="flex-1 pr-2">
             <input
              type="text"
              placeholder="SCAN YOUR MEAL..."
              className="bg-transparent w-full outline-none text-white placeholder-zinc-500 font-bold text-xs uppercase tracking-widest"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            {isLoading ? (
              <p className="text-[10px] text-[#CCFF00] font-medium italic">Analyzing nutrition...</p>
            ) : (
              <p className="text-[10px] text-zinc-500 font-medium italic hidden sm:block">LLM Vision Analysis Active</p>
            )}
          </div>
        </div>
        
        {input.trim() ? (
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="w-10 h-10 bg-[#CCFF00] text-black rounded-xl flex items-center justify-center hover:bg-[#b3ff00] transition-colors shrink-0"
          >
             <Send className="w-5 h-5" />
          </button>
        ) : (
          <button 
            className="w-10 h-10 bg-[#1A1A1A] border border-zinc-700 text-zinc-400 rounded-xl flex items-center justify-center hover:bg-zinc-800 transition-colors shrink-0 max-sm:hidden"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.capture = 'environment';
              input.onchange = (e: any) => handleFileUpload({ target: { files: e.target.files } } as any);
              input.click();
           }}
          >
             <Camera className="w-5 h-5 opacity-40 hover:opacity-100" />
          </button>
        )}
      </div>
    </div>
  );
}
