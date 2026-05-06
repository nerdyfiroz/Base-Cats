'use client';

import { create } from 'zustand';
import { Resources, CatRecord, Player } from '@/lib/supabase';

interface GameStore {
  player: Player | null;
  cats: CatRecord[];
  resources: Resources | null;
  activeCat: CatRecord | null;
  notification: { msg: string; type: 'success' | 'error' | 'info' } | null;

  setPlayer: (p: Player | null) => void;
  setCats: (cats: CatRecord[]) => void;
  setResources: (r: Resources) => void;
  setActiveCat: (cat: CatRecord | null) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  clearNotif: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  player: null,
  cats: [],
  resources: null,
  activeCat: null,
  notification: null,

  setPlayer:     (player)   => set({ player }),
  setCats:       (cats)     => set({ cats, activeCat: cats[0] ?? null }),
  setResources:  (resources)=> set({ resources }),
  setActiveCat:  (activeCat)=> set({ activeCat }),
  notify: (msg, type = 'info') => {
    set({ notification: { msg, type } });
    setTimeout(() => set({ notification: null }), 3500);
  },
  clearNotif: () => set({ notification: null }),
}));
