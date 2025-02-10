import { useToast } from '@chakra-ui/react'

export const useCartToast = () => {
  const toast = useToast()

  const showCartToast = (title, description) => {
    toast({
      title,
      description,
      status: 'success',
      duration: 3000,
      isClosable: true,
      position: 'bottom-right',
      variant: 'solid',
      containerStyle: {
        fontFamily: 'nbText',
        border: '2px solid black',
        borderRadius: 'lg',
        boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
      }
    })
  }

  return showCartToast
} 