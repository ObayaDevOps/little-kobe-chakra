import { useEffect } from 'react'
import client from '../../sanity/lib/client'
import { groq } from 'next-sanity'
import { useSearchCatalogStore } from './searchCatalogStore'

export function useEnsureSearchCatalog() {
  const items = useSearchCatalogStore(state => state.items)
  const setCatalog = useSearchCatalogStore(state => state.setCatalog)

  useEffect(() => {
    if (items.length > 0) return

    let isMounted = true

    const hydrateSearchCatalog = async () => {
      try {
        const minimalProducts = await client.fetch(groq`
          *[_type == "product"]{
            _id,
            name,
            "slug": slug.current,
            "categories": categories[]->title
          }
        `)

        if (!isMounted) return

        setCatalog(minimalProducts, 'fallback-page')
      } catch (error) {
        console.error('Failed to hydrate search catalog from fallback page:', error)
      }
    }

    hydrateSearchCatalog()

    return () => {
      isMounted = false
    }
  }, [items.length, setCatalog])
}

