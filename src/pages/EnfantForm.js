import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  VStack,
  Button,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Card,
  CardBody,
  Heading,
  HStack,
} from '@chakra-ui/react';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import api from '../services/api';

export default function EnfantForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const toast = useToast();
  const isEditMode = !!id;

  const [enfant, setEnfant] = useState({
    nom: '',
    prenom: '',
    date_naissance: '',
    abonne_id: location.state?.abonneId || ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && location.state?.enfant) {
      const { nom, prenom, date_naissance } = location.state.enfant;
      setEnfant({
        ...enfant,
        nom,
        prenom,
        date_naissance: new Date(date_naissance).toISOString().split('T')[0]
      });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode) {
        await api.put(`/enfants/abonnes/${enfant.abonne_id}/enfants/${id}`, enfant);
      } else {
        await api.post(`/enfants/abonnes/${enfant.abonne_id}/enfants`, enfant);
      }

      toast({
        title: 'Succès',
        description: `Enfant ${isEditMode ? 'modifié' : 'ajouté'} avec succès`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Retourner à la page précédente
      navigate(location.state?.returnPath || '/abonnes');
    } catch (error) {
      toast({
        title: 'Erreur',
        description: `Impossible de ${isEditMode ? 'modifier' : 'créer'} l'enfant`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={4}>
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Button
                leftIcon={<FiArrowLeft />}
                variant="ghost"
                onClick={() => navigate(location.state?.returnPath || '/abonnes')}
              >
                Retour
              </Button>
              <Heading size="lg">{isEditMode ? 'Modifier' : 'Ajouter'} un enfant</Heading>
            </HStack>

            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Nom</FormLabel>
                  <Input
                    value={enfant.nom}
                    onChange={(e) => setEnfant({ ...enfant, nom: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Prénom</FormLabel>
                  <Input
                    value={enfant.prenom}
                    onChange={(e) => setEnfant({ ...enfant, prenom: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Date de naissance</FormLabel>
                  <Input
                    type="date"
                    value={enfant.date_naissance}
                    onChange={(e) => setEnfant({ ...enfant, date_naissance: e.target.value })}
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="brand"
                  leftIcon={<FiSave />}
                  isLoading={loading}
                  w="100%"
                >
                  {isEditMode ? 'Modifier' : 'Ajouter'}
                </Button>
              </VStack>
            </form>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
} 