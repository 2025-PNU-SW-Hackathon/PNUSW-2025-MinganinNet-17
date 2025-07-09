import { create } from 'zustand';

interface HabitState {
  habit: string;
  time: string;
  days: string[];
  intensity: string;
  difficulty: string;
  setHabit: (habit: string) => void;
  setTime: (time: string) => void;
  setDays: (days: string[]) => void;
  setIntensity: (intensity: string) => void;
  setDifficulty: (difficulty: string) => void;
  reset: () => void;
}

export const useHabitStore = create<HabitState>((set) => ({
  habit: '',
  time: '',
  days: [],
  intensity: '',
  difficulty: '',
  setHabit: (habit) => set({ habit }),
  setTime: (time) => set({ time }),
  setDays: (days) => set({ days }),
  setIntensity: (intensity) => set({ intensity }),
  setDifficulty: (difficulty) => set({ difficulty }),
  reset: () => set({ habit: '', time: '', days: [], intensity: '', difficulty: '' }),
})); 