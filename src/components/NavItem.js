import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiSettings,
  FiUser,
  FiBarChart2,
} from 'react-icons/fi';

const NavItem = ({ icon, children, to, ...rest }) => {
  const iconMap = {
    home: FiHome,
    users: FiUsers,
    documents: FiFileText,
    settings: FiSettings,
    profile: FiUser,
    reports: FiBarChart2,
  };

  const IconComponent = iconMap[icon] || FiHome;
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.600', 'blue.200');
  const inactiveColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <RouterLink to={to} style={{ textDecoration: 'none' }}>
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        _hover={{
          bg: activeBg,
          color: activeColor,
        }}
        {...rest}
      >
        <Box
          mr="4"
          fontSize="16"
          color={inactiveColor}
          _groupHover={{
            color: activeColor,
          }}
        >
          <IconComponent />
        </Box>
        <Text
          fontSize="sm"
          fontWeight="medium"
          color={inactiveColor}
          _groupHover={{
            color: activeColor,
          }}
        >
          {children}
        </Text>
      </Flex>
    </RouterLink>
  );
};

export default NavItem; 