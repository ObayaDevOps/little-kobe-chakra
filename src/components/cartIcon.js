import { FiShoppingCart } from 'react-icons/fi'
import { Badge, IconButton } from '@chakra-ui/react'
import { useCartStore } from '../lib/cartStore'

export default function CartIcon() {
  const items = useCartStore(state => state.items)
  
  return (
    <IconButton
      aria-label="カートを見る"
      icon={
        <>
          <FiShoppingCart size="24px" />
          {items.length > 0 && (
            <Badge
              colorScheme="red"
              variant="solid"
              fontSize="0.8em"
              position="absolute"
              top="-4px"
              right="-4px"
            >
              {items.reduce((sum, item) => sum + item.quantity, 0)}
            </Badge>
          )}
        </>
      }
      variant="ghost"
      position="relative"
    />
  )
}