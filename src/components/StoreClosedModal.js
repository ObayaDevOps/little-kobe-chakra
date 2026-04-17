import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Box,
} from '@chakra-ui/react';
import { useDisclosure } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useStoreStatusStore } from '../lib/storeStatusStore';

export default function StoreClosedModal() {
  const { isOpen: storeIsOpen, message, nextOpeningTime } = useStoreStatusStore();
  const { isOpen: modalIsOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (storeIsOpen === false) {
      onOpen();
    }
  }, [storeIsOpen, onOpen]);

  if (storeIsOpen !== false) return null;

  return (
    <Modal isOpen={modalIsOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent
        bg="#fcd7d7"
        borderColor="black"
        borderWidth="2px"
        borderRadius="lg"
        boxShadow="6px 6px 0px 0px rgba(0, 0, 0, 1)"
      >
        <ModalHeader fontFamily="nbHeading" fontSize="xl" borderBottomWidth="2px" borderBottomColor="black">
          Shop Currently Closed
        </ModalHeader>
        <ModalBody py={6}>
          <Text fontFamily="nbText" fontSize="md">
            {message || 'The shop is currently closed.'}
          </Text>
          <Box
            mt={4}
            p={3}
            bg="white"
            borderRadius="md"
            borderWidth="1px"
            borderColor="black"
          >
            <Text fontFamily="nbText" fontSize="sm" color="gray.600">
              You can still place an order! Deliveries for orders placed now will be carried out at {nextOpeningTime || 'our next opening time'}.
            </Text>
          </Box>
        </ModalBody>
        <ModalFooter borderTopWidth="2px" borderTopColor="black">
          <Button
            onClick={onClose}
            fontFamily="nbHeading"
            bg="white"
            color="black"
            borderColor="black"
            borderWidth="2px"
            borderRadius="lg"
            boxShadow="4px 4px 0px 0px rgba(0, 0, 0, 1)"
            _hover={{ transform: 'translateY(-2px)', boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)' }}
            transition="all 0.15s ease"
          >
            Browse Products
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
