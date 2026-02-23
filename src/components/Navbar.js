import {
  Box,
  Flex,
  Link,
  Text,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  useDisclosure,
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import { X } from 'lucide-react'
import CartIcon from './cartIcon'
import CartDrawer from './CartDrawer'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useCartDrawerStore } from '../lib/cartDrawerStore'
import { useSearchCatalogStore } from '../lib/searchCatalogStore'

export default function NavBar({ productSearch }) {
  const isOpen = useCartDrawerStore(state => state.isOpen)
  const openDrawer = useCartDrawerStore(state => state.open)
  const closeDrawer = useCartDrawerStore(state => state.close)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const drawerSearchInputRef = useRef(null)
  const searchDrawer = useDisclosure()
  const router = useRouter()
  const { pathname } = router
  const catalogItems = useSearchCatalogStore(state => state.items)
  const isHomePage = pathname === '/'
  const searchQuery = productSearch?.query ?? localSearchQuery
  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const hasSearchQuery = searchQuery.trim().length > 0
  const showSuggestions = searchDrawer.isOpen && hasSearchQuery
  const filteredCatalogItems = normalizedSearchQuery
    ? catalogItems.filter((item) => {
        const inName = item.name.toLowerCase().includes(normalizedSearchQuery)
        const inCategories = item.categories?.some((category) =>
          category.toLowerCase().includes(normalizedSearchQuery)
        )
        return inName || inCategories
      })
    : catalogItems
  const searchSuggestions = normalizedSearchQuery
    ? filteredCatalogItems
        .slice()
        .sort((a, b) => {
          const aStarts = a.name.toLowerCase().startsWith(normalizedSearchQuery)
          const bStarts = b.name.toLowerCase().startsWith(normalizedSearchQuery)
          if (aStarts === bStarts) return a.name.localeCompare(b.name)
          return aStarts ? -1 : 1
        })
        .slice(0, 6)
    : []

  useEffect(() => {
    if (pathname !== '/') {
      setIsVisible(true)
      return
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollingDown = currentScrollY > lastScrollY

      if (scrollingDown && isVisible) {
        setIsVisible(false)
      } else if (!scrollingDown && !isVisible) {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isVisible, lastScrollY, pathname])

  useEffect(() => {
    searchDrawer.onClose()
  }, [pathname])

  useEffect(() => {
    if (searchDrawer.isOpen) {
      setIsSearchFocused(true)
    } else {
      setIsSearchFocused(false)
    }
  }, [searchDrawer.isOpen])

  const handleSearchTrigger = () => {
    searchDrawer.onOpen()
  }

  const handleSearchQueryChange = (value) => {
    if (productSearch?.onQueryChange && isHomePage) {
      productSearch.onQueryChange(value)
      return
    }

    setLocalSearchQuery(value)
  }

  const handleSearchClear = () => {
    if (productSearch?.onClear && isHomePage) {
      productSearch.onClear()
      return
    }

    setLocalSearchQuery('')
  }

  const handleSuggestionSelect = (product) => {
    if (productSearch?.onSelectSuggestion && isHomePage) {
      productSearch.onSelectSuggestion(product)
    } else if (product.slug) {
      router.push(`/products/${product.slug}`)
    }

    setIsSearchFocused(false)
    searchDrawer.onClose()
  }

  const renderSuggestions = () => {
    if (!hasSearchQuery) return null

    return (
      <Box
        mt={3}
        bg="white"
        border="2px solid"
        borderColor="black"
        borderRadius="lg"
        overflow="hidden"
        boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
      >
        {searchSuggestions.length > 0 ? (
          <>
            {searchSuggestions.map((product) => (
              <Box
                key={product._id}
                as="button"
                type="button"
                w="100%"
                textAlign="left"
                px={4}
                py={3}
                borderBottom="1px solid"
                borderColor="#ececec"
                bg="white"
                _hover={{ bg: '#fff5f5' }}
                _last={{ borderBottom: 'none' }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSuggestionSelect(product)}
              >
                <Text fontFamily="nbText" fontSize="sm" fontWeight="600" color="black">
                  {product.name}
                </Text>
                {product.categories?.[0] && (
                  <Text fontFamily="nbText" fontSize="xs" color="gray.600" mt={0.5}>
                    {product.categories[0]}
                  </Text>
                )}
              </Box>
            ))}
            <Box px={4} py={2} bg="#fff9f9" borderTop="1px solid" borderColor="#ececec">
              <Text fontFamily="nbText" fontSize="xs" color="gray.700">
                {filteredCatalogItems.length} matching item(s)
              </Text>
            </Box>
          </>
        ) : (
          <Box px={4} py={3}>
            <Text fontFamily="nbText" fontSize="sm" color="gray.700">
              {catalogItems.length === 0
                ? 'Search catalog is loading...'
                : `No items matching "${searchQuery}"`}
            </Text>
          </Box>
        )}
      </Box>
    )
  }

  const renderSearchInput = () => (
    <Box position="relative" w="100%">
      <InputGroup
        borderColor="black"
        borderWidth="2px"
        borderRadius="lg"
        bg="white"
        size="lg"
        boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
      >
        <InputLeftElement pointerEvents="none" h="48px">
          <SearchIcon color="black" />
        </InputLeftElement>
        <Input
          ref={drawerSearchInputRef}
          value={searchQuery}
          onChange={(e) => handleSearchQueryChange(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setTimeout(() => setIsSearchFocused(false), 120)}
          placeholder={productSearch?.placeholder || 'Search products...'}
          fontFamily="nbText"
          border="none"
          _focusVisible={{ boxShadow: 'none' }}
        />
        {hasSearchQuery && (
          <InputRightElement
            cursor="pointer"
            h="48px"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleSearchClear}
          >
            <X size={18} color="black" />
          </InputRightElement>
        )}
      </InputGroup>
      {showSuggestions || (hasSearchQuery && isSearchFocused) ? renderSuggestions() : null}
    </Box>
  )

  return (
    <Box bg="#fcd7d7">
      <Flex
        as="nav"
        bg="white"
        p={{ base: 3, md: 4 }}
        gap={{ base: 2, md: 4 }}
        wrap="nowrap"
        alignItems="center"
        borderColor="black"
        borderBottomWidth={'3px'}
        style={{
          position: pathname === '/' ? 'fixed' : 'static',
          top: isVisible ? '0' : '-100px',
          width: '100%',
          transition: 'top 0.3s ease-in-out',
          zIndex: 1000,
        }}
      >
        <Box order={0} position="relative" flexShrink={0}>
          <IconButton
            aria-label="Search products"
            icon={<SearchIcon />}
            onClick={handleSearchTrigger}
            variant="ghost"
            color="black"
            bg="transparent"
            borderRadius="full"
            border="none"
            boxShadow="none"
            _hover={{ bg: '#fff5f5' }}
            _active={{ bg: '#fdeaea' }}
            _focusVisible={{ boxShadow: 'none' }}
          />
        </Box>

        <Flex
          flex="1"
          minW={0}
          w="auto"
          justifyContent={{ base: 'center', md: 'center' }}
          order={0}
        >
          <Link href="/">
            <Text
              fontSize={{ base: 'xs', md: 'md', lg: '1.5rem' }}
              ml={{ base: 0, md: 2 }}
              px={{ base: 1, md: 0 }}
              color="black"
              fontWeight={'600'}
              textAlign={{ base: 'center', md: 'center' }}
              fontFamily={'logoFont'}
              noOfLines={{base:2, md: 1}}
              maxW="none"
            >
              Little Kobe Japanese Market
            </Text>
          </Link>
        </Flex>

        <Flex gap={{ base: 2, md: 6 }} order={0} flexShrink={0} ml="auto">
          <CartIcon onClick={openDrawer} />
        </Flex>
      </Flex>
      
      <CartDrawer isOpen={isOpen} onClose={closeDrawer} />

      <Drawer
        isOpen={searchDrawer.isOpen}
        placement="left"
        onClose={searchDrawer.onClose}
        initialFocusRef={drawerSearchInputRef}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent
          bg="#fcd7d7"
          borderRightColor="black"
          borderRightWidth="4px"
        >
          <DrawerCloseButton 
            borderColor="black"
            borderWidth="1px"
            borderRadius="lg"
            boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
            bg="white"
            m={2}
          />
          <DrawerHeader>
            <Heading size="xl" fontFamily={'nbHeading'}>Search Products</Heading>
          </DrawerHeader>
          <DrawerBody>
            <Box
              bg="white"
              border="2px solid"
              borderColor="black"
              borderRadius="xl"
              p={3}
              boxShadow="2px 2px 0px 0px rgba(0, 0, 0, 1)"
            >
              {renderSearchInput()}
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}
