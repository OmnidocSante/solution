import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  Heading,
  useToast,
  Card,
  CardBody,
  Grid,
  GridItem,
  useColorModeValue
} from '@chakra-ui/react';
import api from '../services/api';
import { villes } from '../constants/villes';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'saisie',
    agence: '',
    ville: '',
    poste: ''
  });

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await api.get(`/users/${id}`);
      const { password, ...userData } = response.data;
      setFormData(userData);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de l\'utilisateur',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      navigate('/users');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        await api.put(`/users/${id}`, formData);
        toast({
          title: 'Succès',
          description: 'Utilisateur mis à jour avec succès',
          status: 'success',
          duration: 5000,
          isClosable: true
        });
      } else {
        await api.post('/users', formData);
        toast({
          title: 'Succès',
          description: 'Utilisateur créé avec succès',
          status: 'success',
          duration: 5000,
          isClosable: true
        });
      }
      navigate('/users');
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Une erreur est survenue',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={4}>
      <Card bg={bgColor} borderColor={borderColor} borderWidth={1}>
        <CardBody>
          <VStack spacing={6} align="stretch">
            <Heading size="lg">
              {id ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </Heading>

            <form onSubmit={handleSubmit}>
              <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Nom</FormLabel>
                    <Input
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      placeholder="Nom"
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Prénom</FormLabel>
                    <Input
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      placeholder="Prénom"
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email"
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isRequired={!id}>
                    <FormLabel>Mot de passe</FormLabel>
                    <Input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={id ? 'Laisser vide pour ne pas modifier' : 'Mot de passe'}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Rôle</FormLabel>
                    <Select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="admin">Admin</option>
                      <option value="saisie">Saisie</option>
                    </Select>
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Agence</FormLabel>
                    <Input
                      name="agence"
                      value={formData.agence}
                      onChange={handleChange}
                      placeholder="Agence"
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Ville</FormLabel>
                    <Select
                      name="ville"
                      value={formData.ville}
                      onChange={handleChange}
                      placeholder="Sélectionner une ville"
                    >
                      {villes.map((ville) => (
                        <option key={ville.value} value={ville.value}>
                          {ville.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Poste</FormLabel>
                    <Input
                      name="poste"
                      value={formData.poste}
                      onChange={handleChange}
                      placeholder="Poste"
                    />
                  </FormControl>
                </GridItem>
              </Grid>

              <Box mt={6} display="flex" justifyContent="flex-end" gap={4}>
                <Button
                  onClick={() => navigate('/users')}
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  colorScheme="blue"
                  isLoading={loading}
                >
                  {id ? 'Mettre à jour' : 'Créer'}
                </Button>
              </Box>
            </form>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default UserForm; 