import { create } from 'zustand';

export const useStoreStatusStore = create((set, get) => ({
  isOpen: null, // null = loading, true/false = known
  nextOpeningTime: null,
  message: '',

  fetchStatus: async () => {
    // Avoid duplicate fetches
    if (get().isOpen !== null) return;
    try {
      const res = await fetch('/api/store-status');
      if (!res.ok) throw new Error('Failed to fetch store status');
      const data = await res.json();
      set({
        isOpen: data.isOpen,
        nextOpeningTime: data.nextOpeningTime,
        message: data.message,
      });
    } catch (err) {
      console.error('Store status fetch error:', err);
      // Default to open on error to avoid blocking customers
      set({ isOpen: true, nextOpeningTime: null, message: '' });
    }
  },
}));
