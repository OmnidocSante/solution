import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Card,
  CardBody,
  Grid,
  GridItem,
  Badge,
  useToast,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Link,
} from '@chakra-ui/react';
import { FiArrowLeft, FiSave, FiTrash2, FiDownload, FiUpload, FiEdit } from 'react-icons/fi';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';

// Fonction pour formater la date en JJ/MM/AAAA
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Fonction pour convertir JJ/MM/AAAA en YYYY-MM-DD
const convertToISODate = (dateString) => {
  if (!dateString) return '';
  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
};

export default function AbonneDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { socket } = useSocket();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enfantsLoading, setEnfantsLoading] = useState(true);
  const [conjointsLoading, setConjointsLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [abonne, setAbonne] = useState({
    nom: '',
    prenom: '',
    date_naissance: '',
    cin: '',
    telephone: '',
    ville: '',
    adresse: '',
    numero_identification: '',
    date_debut: '',
    date_expiration: '',
    fichiers: []
  });
  const [enfants, setEnfants] = useState([]);
  const [conjoints, setConjoints] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const fetchEnfants = async () => {
    try {
      const response = await api.get(`/enfants/abonnes/${id}/enfants`);
      setEnfants(response.data);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les enfants',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setEnfantsLoading(false);
    }
  };

  const fetchConjoints = async () => {
    try {
      const response = await api.get(`/conjoints/abonnes/${id}/conjoints`);
      setConjoints(response.data);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les conjoints',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setConjointsLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await api.get(`/documents/abonnes/${id}/documents`);
      setDocuments(response.data);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les documents',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setDocumentsLoading(false);
    }
  };

  useEffect(() => {
    fetchAbonne();
    fetchEnfants();
    fetchConjoints();
    fetchDocuments();

    if (socket) {
      socket.on('abonne_update', (updatedAbonne) => {
        if (updatedAbonne.id === parseInt(id)) {
          setAbonne(updatedAbonne);
          fetchEnfants();
          fetchConjoints();
          fetchDocuments();
        }
      });

      socket.on('document:uploaded', (data) => {
        if (data.abonne_id === parseInt(id)) {
          fetchDocuments();
        }
      });

      return () => {
        socket.off('abonne_update');
        socket.off('document:uploaded');
      };
    }
  }, [id, socket]);

  const fetchAbonne = async () => {
    try {
      const response = await api.get(`/abonnes/${id}`);
      const formattedAbonne = {
        ...response.data,
        date_naissance: formatDate(response.data.date_naissance),
        date_debut: formatDate(response.data.date_debut),
        date_expiration: formatDate(response.data.date_expiration)
      };
      setAbonne(formattedAbonne);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les informations de l\'abonné',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/abonnes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Convertir les dates au format YYYY-MM-DD avant l'envoi
      const abonneToSubmit = {
        ...abonne,
        date_naissance: convertToISODate(abonne.date_naissance),
        date_debut: convertToISODate(abonne.date_debut),
        date_expiration: convertToISODate(abonne.date_expiration)
      };
      await api.put(`/abonnes/${id}`, abonneToSubmit);
      toast({
        title: 'Succès',
        description: 'Les informations ont été mises à jour',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les informations',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (user?.role !== 'admin') {
      toast({
        title: 'Accès refusé',
        description: 'Vous n\'avez pas les droits nécessaires pour effectuer cette action',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet abonné ?')) {
      try {
        await api.delete(`/abonnes/${id}`);
        toast({
          title: 'Succès',
          description: 'L\'abonné a été supprimé',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        navigate('/abonnes');
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer l\'abonné',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append('document', file);
      formData.append('type', 'manuel');
      formData.append('abonne_id', id);

      try {
        await api.post(`/documents/abonnes/${id}/documents`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        fetchDocuments();
        toast({
          title: 'Succès',
          description: 'Document uploadé avec succès',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible d\'uploader le document',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setUploadLoading(false);
      }
    }
  };

  const handleDocumentDelete = async (documentId) => {
    if (user?.role !== 'admin') {
      toast({
        title: 'Accès refusé',
        description: 'Vous n\'avez pas les droits nécessaires pour effectuer cette action',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      try {
        await api.delete(`/documents/abonnes/${id}/documents/${documentId}`);
        fetchDocuments();
        toast({
          title: 'Succès',
          description: 'Document supprimé avec succès',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le document',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleDownload = async (document) => {
    try {
      // Utiliser la même base URL que l'API
      const filePath = `https://solutions.omnidoc.ma:3001/uploads/${abonne.numero_identification}/${document.nom_fichier}`;
      
      // Ouvrir dans une nouvelle fenêtre
      window.open(filePath, '_blank');
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ouvrir le document',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteEnfant = async (enfantId) => {
    if (user?.role !== 'admin') {
      toast({
        title: 'Accès refusé',
        description: 'Vous n\'avez pas les droits nécessaires pour effectuer cette action',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet enfant ?')) {
      try {
        await api.delete(`/enfants/abonnes/${id}/enfants/${enfantId}`);
        fetchEnfants();
        toast({
          title: 'Succès',
          description: 'Enfant supprimé avec succès',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer l\'enfant',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleDeleteConjoint = async (conjointId) => {
    if (user?.role !== 'admin') {
      toast({
        title: 'Accès refusé',
        description: 'Vous n\'avez pas les droits nécessaires pour effectuer cette action',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce conjoint ?')) {
      try {
        await api.delete(`/conjoints/abonnes/${id}/conjoints/${conjointId}`);
        fetchConjoints();
        toast({
          title: 'Succès',
          description: 'Conjoint supprimé avec succès',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le conjoint',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleEditEnfant = (enfant) => {
    navigate(`/enfants/${enfant.id}/edit`, { 
      state: { 
        enfant,
        abonneId: id,
        returnPath: `/abonnes/${id}`
      } 
    });
  };

  const handleEditConjoint = (conjoint) => {
    navigate(`/conjoints/${conjoint.id}/edit`, { 
      state: { 
        conjoint,
        abonneId: id,
        returnPath: `/abonnes/${id}`
      } 
    });
  };

  const handleAddEnfant = () => {
    navigate(`/enfants/new`, { 
      state: { 
        abonneId: id,
        returnPath: `/abonnes/${id}`
      } 
    });
  };

  const handleAddConjoint = () => {
    navigate(`/conjoints/new`, { 
      state: { 
        abonneId: id,
        returnPath: `/abonnes/${id}`
      } 
    });
  };

  const handleDateChange = (e, field) => {
    const value = e.target.value;
    // Convertir la date du format YYYY-MM-DD en JJ/MM/AAAA
    const [year, month, day] = value.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    setAbonne({ ...abonne, [field]: formattedDate });
  };

  if (loading) {
    return <Box p={4}>Chargement...</Box>;
  }

  return (
    <Box p={4}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between">
          <HStack spacing={4}>
            <Button
              leftIcon={<FiArrowLeft />}
              variant="ghost"
              onClick={() => navigate('/abonnes')}
            >
              Retour
            </Button>
            <Box>
              <Heading size="lg">
                {abonne.nom} {abonne.prenom}
              </Heading>
              <Text color="gray.600" mt={1}>
                Détails de l'abonné
              </Text>
            </Box>
          </HStack>
          <HStack>
            <Button
              leftIcon={<FiSave />}
              colorScheme="brand"
              isLoading={saving}
              onClick={handleSubmit}
            >
              Enregistrer
            </Button>
            {user?.role === 'admin' && (
              <Button
                leftIcon={<FiTrash2 />}
                colorScheme="red"
                variant="outline"
                onClick={handleDelete}
              >
                Supprimer
              </Button>
            )}
          </HStack>
        </HStack>

        <Tabs variant="enclosed">
          <TabList>
            <Tab>Informations</Tab>
            <Tab>Enfants</Tab>
            <Tab>Conjoint</Tab>
            <Tab>Documents</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                <CardBody>
                  <form onSubmit={handleSubmit}>
                    <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                      <GridItem>
                        <FormControl>
                          <FormLabel>Nom</FormLabel>
                          <Input
                            value={abonne.nom}
                            onChange={(e) =>
                              setAbonne({ ...abonne, nom: e.target.value })
                            }
                          />
                        </FormControl>
                      </GridItem>
                      <GridItem>
                        <FormControl>
                          <FormLabel>Prénom</FormLabel>
                          <Input
                            value={abonne.prenom}
                            onChange={(e) =>
                              setAbonne({ ...abonne, prenom: e.target.value })
                            }
                          />
                        </FormControl>
                      </GridItem>
                      <GridItem>
                        <FormControl>
                          <FormLabel>Date de naissance</FormLabel>
                          <Input
                            type="date"
                            value={convertToISODate(abonne.date_naissance)}
                            onChange={(e) => handleDateChange(e, 'date_naissance')}
                          />
                          
                        </FormControl>
                      </GridItem>
                      <GridItem>
                        <FormControl>
                          <FormLabel>CIN</FormLabel>
                          <Input
                            value={abonne.cin}
                            onChange={(e) =>
                              setAbonne({ ...abonne, cin: e.target.value })
                            }
                          />
                        </FormControl>
                      </GridItem>
                      <GridItem>
                        <FormControl>
                          <FormLabel>Téléphone</FormLabel>
                          <Input
                            value={abonne.telephone}
                            onChange={(e) =>
                              setAbonne({ ...abonne, telephone: e.target.value })
                            }
                          />
                        </FormControl>
                      </GridItem>
                      <GridItem>
                        <FormControl>
                          <FormLabel>Ville</FormLabel>
                          <Input
                            value={abonne.ville}
                            onChange={(e) =>
                              setAbonne({ ...abonne, ville: e.target.value })
                            }
                          />
                        </FormControl>
                      </GridItem>
                      <GridItem colSpan={2}>
                        <FormControl>
                          <FormLabel>Adresse</FormLabel>
                          <Input
                            value={abonne.adresse}
                            onChange={(e) =>
                              setAbonne({ ...abonne, adresse: e.target.value })
                            }
                          />
                        </FormControl>
                      </GridItem>
                      <GridItem>
                        <FormControl>
                          <FormLabel>Numéro d'identification</FormLabel>
                          <Input
                            value={abonne.numero_identification}
                            onChange={(e) =>
                              setAbonne({ ...abonne, numero_identification: e.target.value })
                            }
                          />
                        </FormControl>
                      </GridItem>
                      <GridItem>
                        <FormControl>
                          <FormLabel>Date de début</FormLabel>
                          <Input
                            type="date"
                            value={convertToISODate(abonne.date_debut)}
                            isReadOnly
                          />
                          
                        </FormControl>
                      </GridItem>
                      <GridItem>
                        <FormControl>
                          <FormLabel>Date d'expiration</FormLabel>
                          <Input
                            type="date"
                            value={convertToISODate(abonne.date_expiration)}
                            isReadOnly
                          />
                      
                        </FormControl>
                      </GridItem>
                    </Grid>
                  </form>
                </CardBody>
              </Card>
            </TabPanel>

            <TabPanel>
              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="md">Enfants</Heading>
                      <Button
                        leftIcon={<FiUpload />}
                        onClick={handleAddEnfant}
                      >
                        Ajouter un enfant
                      </Button>
                    </HStack>
                    {enfantsLoading ? (
                      <Text>Chargement des enfants...</Text>
                    ) : (
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Nom</Th>
                            <Th>Prénom</Th>
                            <Th>Date de naissance</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {enfants.map((enfant) => (
                            <Tr key={enfant.id}>
                              <Td>{enfant.nom}</Td>
                              <Td>{enfant.prenom}</Td>
                              <Td>{new Date(enfant.date_naissance).toLocaleDateString()}</Td>
                              <Td>
                                <HStack spacing={2}>
                                  <IconButton
                                    icon={<FiEdit />}
                                    onClick={() => handleEditEnfant(enfant)}
                                    size="sm"
                                    variant="ghost"
                                    aria-label="Modifier"
                                  />
                                  <IconButton
                                    icon={<FiTrash2 />}
                                    onClick={() => handleDeleteEnfant(enfant.id)}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    aria-label="Supprimer"
                                  />
                                </HStack>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

            <TabPanel>
              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="md">Conjoints</Heading>
                      <Button
                        leftIcon={<FiUpload />}
                        onClick={handleAddConjoint}
                      >
                        Ajouter un conjoint
                      </Button>
                    </HStack>
                    {conjointsLoading ? (
                      <Text>Chargement des conjoints...</Text>
                    ) : (
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Nom</Th>
                            <Th>Prénom</Th>
                            <Th>Date de naissance</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {conjoints.map((conjoint) => (
                            <Tr key={conjoint.id}>
                              <Td>{conjoint.nom}</Td>
                              <Td>{conjoint.prenom}</Td>
                              <Td>{new Date(conjoint.date_naissance).toLocaleDateString()}</Td>
                              <Td>
                                <HStack spacing={2}>
                                  <IconButton
                                    icon={<FiEdit />}
                                    onClick={() => handleEditConjoint(conjoint)}
                                    size="sm"
                                    variant="ghost"
                                    aria-label="Modifier"
                                  />
                                  <IconButton
                                    icon={<FiTrash2 />}
                                    onClick={() => handleDeleteConjoint(conjoint.id)}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    aria-label="Supprimer"
                                  />
                                </HStack>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

            <TabPanel>
              <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="md">Documents</Heading>
                      <Button
                        leftIcon={<FiUpload />}
                        as="label"
                        htmlFor="file-upload"
                        cursor="pointer"
                        isLoading={uploadLoading}
                      >
                        Upload un document
                        <input
                          id="file-upload"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          style={{ display: 'none' }}
                          onChange={handleFileUpload}
                        />
                      </Button>
                    </HStack>

                    {documentsLoading ? (
                      <Text>Chargement des documents...</Text>
                    ) : (
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Nom du fichier</Th>
                            <Th>Type</Th>
                            <Th>Date d'upload</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {documents.map((document) => (
                            <Tr key={document.id}>
                              <Td>{document.nom_fichier}</Td>
                              <Td>{document.type}</Td>
                              <Td>{new Date(document.created_at).toLocaleDateString()}</Td>
                              <Td>
                                <HStack spacing={2}>
                                  <IconButton
                                    icon={<FiDownload />}
                                    onClick={() => handleDownload(document)}
                                    size="sm"
                                    variant="ghost"
                                    aria-label="Télécharger"
                                  />
                                  <IconButton
                                    icon={<FiTrash2 />}
                                    onClick={() => handleDocumentDelete(document.id)}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    aria-label="Supprimer"
                                  />
                                </HStack>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
} 