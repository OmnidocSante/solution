import React from 'react';
import { Box, Heading, Text, Button, VStack, useColorModeValue } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
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
          <Heading size="xl" color="blue.500">
            404
          </Heading>
          <Heading size="lg">Page Non Trouvée</Heading>
          <Text fontSize="lg" textAlign="center">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </Text>
          <Button
            colorScheme="blue"
            onClick={() => navigate('/')}
            size="lg"
            width="full"
          >
            Retour à l'accueil
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};

export default NotFound; 