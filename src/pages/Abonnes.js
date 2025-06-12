import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  useColorModeValue,
  Card,
  CardBody,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
} from '@chakra-ui/react';
import { FiSearch, FiPlus, FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Abonnes() {
  const [abonnes, setAbonnes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    fetchAbonnes();

    if (socket) {
      // Écouter les nouveaux abonnés
      socket.on('new_abonne', (newAbonne) => {
        if (user.role === 'admin' || newAbonne.user_id === user.id) {
          setAbonnes(prev => [...prev, newAbonne]);
        }
      });

      // Écouter les mises à jour d'abonnés
      socket.on('update_abonne', (updatedAbonne) => {
        setAbonnes(prev => prev.map(a => a.id === updatedAbonne.id ? updatedAbonne : a));
      });

      // Écouter les suppressions d'abonnés
      socket.on('delete_abonne', (deletedAbonne) => {
        setAbonnes(prev => prev.filter(a => a.id !== deletedAbonne.id));
      });

      // Nettoyage des écouteurs
      return () => {
        socket.off('new_abonne');
        socket.off('update_abonne');
        socket.off('delete_abonne');
      };
    }
  }, [socket, user.role, user.id]);

  const fetchAbonnes = async () => {
    try {
      const response = await api.get('/abonnes');
      if (user.role === 'admin') {
        setAbonnes(response.data);
      } else {
        setAbonnes(response.data.filter(abonne => abonne.user_id === user.id));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des abonnés:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (user.role !== 'admin') {
      alert('Vous n\'avez pas les droits pour supprimer des abonnés');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet abonné ?')) {
      try {
        await api.delete(`/abonnes/${id}`);
        // La mise à jour se fera automatiquement via le socket
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const filteredAbonnes = abonnes.filter(
    (abonne) =>
      abonne.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      abonne.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      abonne.cin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      abonne.numero_identification.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (dateExpiration) => {
    const today = new Date();
    const expiration = new Date(dateExpiration);
    const diffTime = expiration - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'red';
    if (diffDays <= 30) return 'orange';
    return 'green';
  };

  const getStatusText = (dateExpiration) => {
    const today = new Date();
    const expiration = new Date(dateExpiration);
    const diffTime = expiration - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expiré';
    if (diffDays <= 30) return 'Expire bientôt';
    return 'Actif';
  };

  return (
    <Box p={4}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between">
          <Box>
            <Heading size="lg">Abonnés</Heading>
            <Text color="gray.600" mt={1}>
              {user.role === 'admin' ? 'Gérez tous les abonnés' : 'Gérez vos abonnés'}
            </Text>
          </Box>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="brand"
            onClick={() => navigate('/abonnes/add')}
          >
            Nouvel Abonné
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
                  placeholder="Rechercher un abonné..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Nom</Th>
                      <Th>CIN</Th>
                      <Th>Numéro d'identification</Th>
                      <Th>Statut</Th>
                      <Th>Date d'expiration</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredAbonnes.map((abonne) => (
                      <Tr key={abonne.id}>
                        <Td>
                          {abonne.nom} {abonne.prenom}
                        </Td>
                        <Td>{abonne.cin}</Td>
                        <Td>{abonne.numero_identification}</Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(abonne.date_expiration)}>
                            {getStatusText(abonne.date_expiration)}
                          </Badge>
                        </Td>
                        <Td>
                          {new Date(abonne.date_expiration).toLocaleDateString()}
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
                                onClick={() => navigate(`/abonnes/${abonne.id}`)}
                              >
                                Modifier
                              </MenuItem>
                              {user.role === 'admin' && (
                                <MenuItem
                                  icon={<FiTrash2 />}
                                  color="red.500"
                                  onClick={() => handleDelete(abonne.id)}
                                >
                                  Supprimer
                                </MenuItem>
                              )}
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
    </Box>
  );
} 