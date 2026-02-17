import { Box, Text, useToast } from '@chakra-ui/react'
import { useCartDrawerStore } from '../lib/cartDrawerStore'

export const useCartToast = () => {
  const toast = useToast()
  const openCartDrawer = useCartDrawerStore(state => state.open)

  const showCartToast = (title, description) => {
    toast({
      duration: 3000,
      isClosable: true,
      position: 'bottom-right',
      render: ({ onClose }) => (
        <Box
          bg="green.500"
          color="white"
          p={4}
          fontFamily="nbText"
          border="2px solid black"
          borderRadius="lg"
          boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
          cursor="pointer"
          role="button"
          tabIndex={0}
          aria-label="Open cart"
          _hover={{ transform: 'translateY(-2px)' }}
          onClick={() => {
            openCartDrawer()
            onClose()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              openCartDrawer()
              onClose()
            }
          }}
        >
          <Text fontFamily="nbHeading" fontWeight="bold">{title}</Text>
          <Text>{description}</Text>
          <Text fontSize="sm" textDecoration="underline">Tap to open cart</Text>
        </Box>
      ),
    })
  }

  return showCartToast
}
