import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  Flex,
  IconButton,
  useColorModeValue,
  useDisclosure
} from '@chakra-ui/react';
import { FiMenu } from 'react-icons/fi';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.100', 'gray.900')}>
      <Sidebar />
      <Box ml="64" p="4">
        <Box pt="5">
          {children}
        </Box>
      </Box>
    </Box>
  );
} 