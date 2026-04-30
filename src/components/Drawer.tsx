import React from 'react';
import { Target, BarChart2, Scale, Bell, Droplet, Users, LogOut, Gift, Shield, MessageSquare, Settings, X } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

const MENU_ITEMS = [
  { icon: Target, label: 'Daily Goals', id: 'goals' },
  { icon: BarChart2, label: 'Weekly Summary', id: 'streak' },
  { icon: Scale, label: 'Weight Tracker', id: 'weight' },
  { icon: Bell, label: 'Reminders', id: 'reminders' },
  { icon: Droplet, label: 'Water Tracker', id: 'water' },
  { icon: Users, label: 'Groups', id: 'groups' },
  { divider: true, id: 'd1' },
  { icon: Gift, label: 'Referral Code', id: 'referral' },
  { icon: Shield, label: 'Terms & Privacy', id: 'privacy' },
  { icon: MessageSquare, label: 'Feedback & Support', id: 'support' },
  { icon: Settings, label: 'Settings', id: 'settings' },
] as const;

export function Drawer({ isOpen, onClose, onNavigate }: DrawerProps) {
  const { user, logout } = useAuth();

  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 backdrop-blur-sm",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <div
        className={clsx(
          "fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-[#0A0A0A] border-r border-[#1A1A1A] z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-[#CCFF00] rounded-lg flex items-center justify-center text-black font-black italic tracking-tighter">J</div>
             <span className="text-xl font-bold text-white tracking-tighter italic uppercase">Journable</span>
           </div>
           <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors rounded-full">
             <X className="w-5 h-5"/>
           </button>
        </div>

        {user && (
          <div className="px-6 py-4 border-b border-zinc-800">
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Signed in as</div>
            <div className="text-sm font-bold text-white truncate">{user.displayName}</div>
            <div className="text-xs text-zinc-500 truncate">{user.email}</div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-2">
          {MENU_ITEMS.map((item) => {
            if ('divider' in item && item.divider) {
              return <div key={item.id} className="h-px bg-zinc-800 my-2 mx-4" />;
            }
            const Icon = (item as { icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }).icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#1A1A1A] transition-colors text-left group"
              >
                <Icon className="w-5 h-5 text-zinc-500 group-hover:text-[#CCFF00] transition-colors" strokeWidth={2} />
                <span className="text-sm font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">{(item as { label: string }).label}</span>
              </button>
            )
          })}

          <div className="h-px bg-zinc-800 my-2 mx-4" />

          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#1A1A1A] transition-colors text-left group"
          >
            <LogOut className="w-5 h-5 text-zinc-500 group-hover:text-red-400 transition-colors" strokeWidth={2} />
            <span className="text-sm font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
