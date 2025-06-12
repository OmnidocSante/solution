import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  useColorModeValue,
  Card,
  CardBody,
  InputGroup,
  InputLeftElement,
  Input,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
} from '@chakra-ui/react';
import { FiSearch, FiPlus, FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();
  const { socket } = useSocket();

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    fetchUsers();

    if (socket) {
      socket.on('user_update', (updatedUser) => {
        setUsers((prev) =>
          prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
        );
      });

      socket.on('user_delete', (deletedId) => {
        setUsers((prev) => prev.filter((u) => u.id !== deletedId));
      });

      return () => {
        socket.off('user_update');
        socket.off('user_delete');
      };
    }
  }, [socket]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les utilisateurs',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await api.delete(`/users/${id}`);
        setUsers((prev) => prev.filter((u) => u.id !== id));
        toast({
          title: 'Succès',
          description: 'Utilisateur supprimé avec succès',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer l\'utilisateur',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    onOpen();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${selectedUser.id}`, selectedUser);
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? selectedUser : u))
      );
      toast({
        title: 'Succès',
        description: 'Utilisateur mis à jour avec succès',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'utilisateur',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'purple';
      case 'manager':
        return 'blue';
      case 'user':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <Box p={4}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between">
          <Box>
            <Heading size="lg">Utilisateurs</Heading>
            <Text color="gray.600" mt={1}>
              Gérez les utilisateurs du système
            </Text>
          </Box>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="brand"
            onClick={() => navigate('/users/add')}
          >
            Nouvel Utilisateur
          </Button>
        </HStack>

        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Nom</Th>
                      <Th>Email</Th>
                      <Th>Rôle</Th>
                      <Th>Statut</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredUsers.map((user) => (
                      <Tr key={user.id}>
                        <Td>
                          {user.nom} {user.prenom}
                        </Td>
                        <Td>{user.email}</Td>
                        <Td>
                          <Badge colorScheme={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={user.actif ? 'green' : 'red'}
                          >
                            {user.actif ? 'Actif' : 'Inactif'}
                          </Badge>
                        </Td>
                        <Td>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<FiMoreVertical />}
                              variant="ghost"
                              size="sm"
                            />
                            <MenuList>
                              <MenuItem
                                icon={<FiEdit2 />}
                                onClick={() => handleEdit(user)}
                              >
                                Modifier
                              </MenuItem>
                              <MenuItem
                                icon={<FiTrash2 />}
                                color="red.500"
                                onClick={() => handleDelete(user.id)}
                              >
                                Supprimer
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Nom</FormLabel>
                  <Input
                    value={selectedUser?.nom || ''}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, nom: e.target.value })
                    }
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Prénom</FormLabel>
                  <Input
                    value={selectedUser?.prenom || ''}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, prenom: e.target.value })
                    }
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={selectedUser?.email || ''}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, email: e.target.value })
                    }
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Rôle</FormLabel>
                  <Select
                    value={selectedUser?.role || 'user'}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, role: e.target.value })
                    }
                  >
                    <option value="admin">Administrateur</option>
                    <option value="manager">Manager</option>
                    <option value="user">Utilisateur</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Statut</FormLabel>
                  <Select
                    value={selectedUser?.actif ? 'actif' : 'inactif'}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        actif: e.target.value === 'actif',
                      })
                    }
                  >
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                  </Select>
                </FormControl>
                <Button
                  type="submit"
                  colorScheme="brand"
                  width="100%"
                >
                  {selectedUser ? 'Mettre à jour' : 'Créer'}
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
} 