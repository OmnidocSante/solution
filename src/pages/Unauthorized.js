import React from 'react';
import { Box, Heading, Text, Button, VStack, useColorModeValue } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={useColorModeValue('gray.50', 'gray.900')}
    >
      <Box
        p={8}
        maxWidth="500px"
        borderWidth={1}
        borderRadius={8}
        boxShadow="lg"
        bg={bgColor}
        borderColor={borderColor}
      >
        <VStack spacing={6}>
          <Heading size="xl" color="red.500">
            Accès Refusé
          </Heading>
          <Text fontSize="lg" textAlign="center">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </Text>
          <Button
            colorScheme="blue"
            onClick={() => navigate(-1)}
            size="lg"
            width="full"
          >
            Retour
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};

export default Unauthorized; 