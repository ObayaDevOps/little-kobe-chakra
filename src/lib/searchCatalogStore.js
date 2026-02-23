import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const sanitizeCatalogItems = (items = []) => {
  const seen = new Set()

  return items
    .map((item) => {
      if (!item) return null

      const categories = Array.isArray(item.categories)
        ? item.categories.filter(Boolean)
        : []

      return {
        _id: item._id,
        name: item.name?.trim?.() || '',
        slug: item.slug || '',
        categories,
      }
    })
    .filter((item) => {
      if (!item || !item.name) return false
      if (!item.slug) return false
      if (!item._id) return false
      if (seen.has(item._id)) return false
      seen.add(item._id)
      return true
    })
}

export const useSearchCatalogStore = create(
  persist(
    (set) => ({
      items: [],
      hydratedAt: null,
      source: null,
      setCatalog: (items, source = 'unknown') =>
        set({
          items: sanitizeCatalogItems(items),
          hydratedAt: Date.now(),
          source,
        }),
      clearCatalog: () =>
        set({
          items: [],
          hydratedAt: null,
          source: null,
        }),
    }),
    {
      name: 'search-catalog-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? window.sessionStorage : undefined
      ),
      partialize: (state) => ({
        items: state.items,
        hydratedAt: state.hydratedAt,
        source: state.source,
      }),
    }
  )
)

