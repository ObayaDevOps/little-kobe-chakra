import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set) => ({
      items: [],
      addItem: (product, quantity) => set((state) => {
        const existingItem = state.items.find(item => item._id === product._id)
        if (existingItem) {
          return {
            items: state.items.map(item => 
              item._id === product._id 
                ? { ...item, quantity: item.quantity + quantity } 
                : item
            )
          }
        }
        return { items: [...state.items, { product, quantity }] }
      }),
      decreaseItem: (id) => set((state) => ({
        items: state.items.map(item => {
          if (item._id === id) {
            const newQuantity = item.quantity - 1
            if (newQuantity <= 0) {
              return null
            }
            return {...item, quantity: newQuantity}
          }
          return item
        }).filter(Boolean)
      })),
      removeItem: (id) => set((state) => ({
        items: state.items.filter(item => item._id !== id)
      })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage', // Unique name for localStorage
    }
  )
) 