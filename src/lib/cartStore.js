import { create } from 'zustand'

export const useCartStore = create((set) => ({
  items: [],
  addItem: (product) => set((state) => {
    const existing = state.items.find(item => item._id === product._id)
    if (existing) {
      return {
        items: state.items.map(item => 
          item._id === product._id 
            ? {...item, quantity: item.quantity + 1}
            : item
        )
      }
    }
    return { items: [...state.items, {...product, quantity: 1}] }
  }),
  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item._id !== id)
  })),
  clearCart: () => set({ items: [] }),
})) 