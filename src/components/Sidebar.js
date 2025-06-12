import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  VStack,
  Icon,
  Text,
  Flex,
  useColorModeValue,
  Divider
} from '@chakra-ui/react';
import {
  FiHome,
  FiUsers,
  FiUserPlus,
  FiFileText,
  FiSettings,
  FiLogOut,
  FiClipboard,
  FiActivity,
  FiUser,
  FiUserCheck
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const NavItem = ({ icon, children, path, isActive, onClick }) => {
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.600', 'blue.200');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  return (
    <Flex
      align="center"
      p="4"
      mx="4"
      borderRadius="lg"
      role="group"
      cursor="pointer"
      onClick={onClick}
      bg={isActive ? activeBg : 'transparent'}
      color={isActive ? activeColor : 'inherit'}
      _hover={{
        bg: isActive ? activeBg : hoverBg,
        color: isActive ? activeColor : 'inherit'
      }}
    >
      <Icon
        mr="4"
        fontSize="16"
        as={icon}
      />
      <Text fontSize="sm" fontWeight={isActive ? 'bold' : 'normal'}>
        {children}
      </Text>
    </Flex>
  );
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { icon: FiUsers, text: 'Abonnés', path: '/abonnes' },
    { icon: FiUserPlus, text: 'Nouvel abonné', path: '/abonnes/add' },
  ];

  const adminMenuItems = [
    { icon: FiUser, text: 'Utilisateurs', path: '/users' },
    { icon: FiUserCheck, text: 'Nouvel utilisateur', path: '/users/add' },
    { icon: FiFileText, text: 'Rapports', path: '/rapports' },
  ];

  return (
    <Box
      bg={bgColor}
      borderRight="1px"
      borderRightColor={borderColor}
      w="64"
      h="100vh"
      py="5"
      position="fixed"
      left="0"
    >
      <VStack spacing={1} align="stretch">
        <Box px="4" py="2">
          <Text fontSize="xl" fontWeight="bold">
            Gestion des Abonnés
          </Text>
        </Box>
        <Divider />
        
        {menuItems.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            path={item.path}
            isActive={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          >
            {item.text}
          </NavItem>
        ))}

        {isAdmin && (
          <>
            <Divider my={2} />
            <Box px="4" py="2">
              <Text fontSize="sm" fontWeight="bold" color="gray.500">
                Administration
              </Text>
            </Box>
            {adminMenuItems.map((item) => (
              <NavItem
                key={item.path}
                icon={item.icon}
                path={item.path}
                isActive={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                {item.text}
              </NavItem>
            ))}
          </>
        )}

        <Divider mt="auto" />
        <NavItem
          icon={FiLogOut}
          onClick={handleLogout}
        >
          Déconnexion
        </NavItem>
      </VStack>
    </Box>
  );
};

export default Sidebar; 