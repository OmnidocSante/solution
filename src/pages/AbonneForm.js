import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useToast,
  Card,
  CardBody,
  Grid,
  GridItem,
  useColorModeValue,
  Textarea,
  IconButton,
  HStack,
  Divider,
  Text
} from '@chakra-ui/react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../services/api';

const AbonneForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    date_naissance: '',
    cin: '',
    telephone: '',
    ville: '',
    adresse: '',
    numero_identification: '',
    date_debut: new Date().toISOString().split('T')[0],
    date_expiration: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    enfants: [],
    conjoints: [],
    fichiers: []
  });

  const [newEnfant, setNewEnfant] = useState({
    nom: '',
    prenom: '',
    date_naissance: ''
  });

  const [newConjoint, setNewConjoint] = useState({
    nom: '',
    prenom: '',
    date_naissance: ''
  });

  useEffect(() => {
    if (id) {
      fetchAbonne();
    }
  }, [id]);

  const fetchAbonne = async () => {
    try {
      const response = await api.get(`/abonnes/${id}`);
      setFormData(response.data);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de l\'abonné',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      navigate('/abonnes');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEnfantChange = (e) => {
    const { name, value } = e.target;
    setNewEnfant(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConjointChange = (e) => {
    const { name, value } = e.target;
    setNewConjoint(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addEnfant = () => {
    if (newEnfant.nom && newEnfant.prenom && newEnfant.date_naissance) {
      setFormData(prev => ({
        ...prev,
        enfants: [...prev.enfants, { ...newEnfant }]
      }));
      setNewEnfant({ nom: '', prenom: '', date_naissance: '' });
    }
  };

  const addConjoint = () => {
    if (newConjoint.nom && newConjoint.prenom && newConjoint.date_naissance) {
      setFormData(prev => ({
        ...prev,
        conjoints: [...prev.conjoints, { ...newConjoint }]
      }));
      setNewConjoint({ nom: '', prenom: '', date_naissance: '' });
    }
  };

  const removeEnfant = (index) => {
    setFormData(prev => ({
      ...prev,
      enfants: prev.enfants.filter((_, i) => i !== index)
    }));
  };

  const removeConjoint = (index) => {
    setFormData(prev => ({
      ...prev,
      conjoints: prev.conjoints.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Préparation des données pour l'envoi
    const dataToSend = {
      ...formData,
      date_debut: formData.date_debut ? new Date(formData.date_debut).toISOString().split('T')[0] : null,
      date_expiration: formData.date_expiration ? new Date(formData.date_expiration).toISOString().split('T')[0] : null
    };

    // Sauvegarder les enfants et conjoints séparément
    const enfantsToSend = formData.enfants.map(enfant => ({
      ...enfant,
      date_naissance: new Date(enfant.date_naissance).toISOString().split('T')[0]
    }));

    const conjointsToSend = formData.conjoints.map(conjoint => ({
      ...conjoint,
      date_naissance: new Date(conjoint.date_naissance).toISOString().split('T')[0]
    }));

    console.log('Données envoyées au serveur:', dataToSend);
    console.log('Enfants à envoyer:', enfantsToSend);
    console.log('Conjoints à envoyer:', conjointsToSend);

    try {
      let abonneId;
      if (id) {
        await api.put(`/abonnes/${id}`, dataToSend);
        abonneId = id;
      } else {
        const response = await api.post('/abonnes', dataToSend);
        console.log('Réponse du serveur pour la création de l\'abonné:', response.data);
        abonneId = response.data.id;

        // Générer le certificat PDF après la création de l'abonné
        try {
          console.log('Début de la génération du certificat pour l\'abonné:', {
            abonneId,
            numero_identification: formData.numero_identification,
            nom: formData.nom,
            prenom: formData.prenom
          });

          const documentData = {
            type: 'certificat',
            abonne_id: abonneId,
            numero_identification: formData.numero_identification,
            nom: formData.nom,
            prenom: formData.prenom,
            date_debut: formData.date_debut,
            date_expiration: formData.date_expiration
          };

          console.log('Données envoyées pour la génération du certificat:', documentData);
          
          const certResponse = await api.post(`/documents/abonnes/${abonneId}/documents`, documentData);
          console.log('Réponse du serveur pour la génération du certificat:', certResponse.data);
          
          console.log('Certificat généré avec succès');
        } catch (certError) {
          console.error('Erreur détaillée lors de la génération du certificat:', {
            message: certError.message,
            response: certError.response?.data,
            status: certError.response?.status,
            headers: certError.response?.headers,
            config: certError.config
          });
          // On continue même si la génération du certificat échoue
        }
      }

      // Envoyer les enfants
      if (enfantsToSend.length > 0) {
        for (const enfant of enfantsToSend) {
          await api.post(`/enfants/abonnes/${abonneId}/enfants`, enfant);
        }
      }

      // Envoyer les conjoints
      if (conjointsToSend.length > 0) {
        for (const conjoint of conjointsToSend) {
          await api.post(`/conjoints/abonnes/${abonneId}/conjoints`, conjoint);
        }
      }

      toast({
        title: 'Succès',
        description: 'Abonné créé avec succès',
        status: 'success',
        duration: 5000,
        isClosable: true
      });
      navigate('/abonnes');
    } catch (error) {
      console.error('Erreur complète:', error);
      console.error('Message d\'erreur:', error.response?.data);
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
              {id ? 'Modifier l\'abonné' : 'Nouvel abonné'}
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
                    <FormLabel>Date de naissance</FormLabel>
                    <Input
                      name="date_naissance"
                      type="date"
                      value={formData.date_naissance}
                      onChange={handleChange}
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>CIN</FormLabel>
                    <Input
                      name="cin"
                      value={formData.cin}
                      onChange={handleChange}
                      placeholder="CIN"
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Téléphone</FormLabel>
                    <Input
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      placeholder="Téléphone"
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Ville</FormLabel>
                    <Input
                      name="ville"
                      value={formData.ville}
                      onChange={handleChange}
                      placeholder="Ville"
                    />
                  </FormControl>
                </GridItem>

                <GridItem colSpan={2}>
                  <FormControl isRequired>
                    <FormLabel>Adresse</FormLabel>
                    <Textarea
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleChange}
                      placeholder="Adresse"
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Numéro d'identification</FormLabel>
                    <Input
                      name="numero_identification"
                      value={formData.numero_identification}
                      onChange={handleChange}
                      placeholder="Numéro d'identification"
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Date de début</FormLabel>
                    <Input
                      name="date_debut"
                      type="date"
                      value={formData.date_debut}
                      onChange={handleChange}
                      isReadOnly
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Date d'expiration</FormLabel>
                    <Input
                      name="date_expiration"
                      type="date"
                      value={formData.date_expiration}
                      onChange={handleChange}
                      isReadOnly
                    />
                  </FormControl>
                </GridItem>
              </Grid>

              <Divider my={6} />

              {/* Section Enfants */}
              <VStack spacing={4} align="stretch">
                <Heading size="md">Enfants</Heading>
                <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                  <GridItem>
                    <FormControl>
                      <FormLabel>Nom</FormLabel>
                      <Input
                        name="nom"
                        value={newEnfant.nom}
                        onChange={handleEnfantChange}
                        placeholder="Nom"
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel>Prénom</FormLabel>
                      <Input
                        name="prenom"
                        value={newEnfant.prenom}
                        onChange={handleEnfantChange}
                        placeholder="Prénom"
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel>Date de naissance</FormLabel>
                      <Input
                        name="date_naissance"
                        type="date"
                        value={newEnfant.date_naissance}
                        onChange={handleEnfantChange}
                      />
                    </FormControl>
                  </GridItem>
                </Grid>
                <Button leftIcon={<FiPlus />} onClick={addEnfant} size="sm">
                  Ajouter un enfant
                </Button>

                {formData.enfants.map((enfant, index) => (
                  <HStack key={index} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                    <Text>{enfant.nom} {enfant.prenom} - {enfant.date_naissance}</Text>
                    <IconButton
                      icon={<FiTrash2 />}
                      onClick={() => removeEnfant(index)}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                    />
                  </HStack>
                ))}
              </VStack>

              <Divider my={6} />

              {/* Section Conjoint */}
              <VStack spacing={4} align="stretch">
                <Heading size="md">Conjoint</Heading>
                <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                  <GridItem>
                    <FormControl>
                      <FormLabel>Nom</FormLabel>
                      <Input
                        name="nom"
                        value={newConjoint.nom}
                        onChange={handleConjointChange}
                        placeholder="Nom"
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel>Prénom</FormLabel>
                      <Input
                        name="prenom"
                        value={newConjoint.prenom}
                        onChange={handleConjointChange}
                        placeholder="Prénom"
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel>Date de naissance</FormLabel>
                      <Input
                        name="date_naissance"
                        type="date"
                        value={newConjoint.date_naissance}
                        onChange={handleConjointChange}
                      />
                    </FormControl>
                  </GridItem>
                </Grid>
                <Button leftIcon={<FiPlus />} onClick={addConjoint} size="sm">
                  Ajouter un conjoint
                </Button>

                {formData.conjoints.map((conjoint, index) => (
                  <HStack key={index} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                    <Text>{conjoint.nom} {conjoint.prenom} - {conjoint.date_naissance}</Text>
                    <IconButton
                      icon={<FiTrash2 />}
                      onClick={() => removeConjoint(index)}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                    />
                  </HStack>
                ))}
              </VStack>

              <Box mt={6} display="flex" justifyContent="flex-end" gap={4}>
                <Button
                  onClick={() => navigate('/abonnes')}
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

export default AbonneForm; 