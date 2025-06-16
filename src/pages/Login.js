import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Container,
  Card,
  CardBody,
  InputGroup,
  InputRightElement,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormErrorMessage,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registerData, setRegisterData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [registerLoading, setRegisterLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const toast = useToast();

  // Rediriger si déjà connecté
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'L\'email est requis';
    if (!password) newErrors.password = 'Le mot de passe est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegisterForm = () => {
    const newErrors = {};
    if (!registerData.nom) newErrors.nom = 'Le nom est requis';
    if (!registerData.prenom) newErrors.prenom = 'Le prénom est requis';
    if (!registerData.email) newErrors.email = 'L\'email est requis';
    if (!registerData.password) newErrors.password = 'Le mot de passe est requis';
    if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    if (registerData.password && registerData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      toast({
        title: 'Erreur de connexion',
        description: error.response?.data?.message || 'Email ou mot de passe incorrect',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;

    setRegisterLoading(true);
    try {
      await api.post('/users', {
        nom: registerData.nom,
        prenom: registerData.prenom,
        email: registerData.email,
        password: registerData.password,
      });
      toast({
        title: 'Compte créé',
        description: 'Vous pouvez maintenant vous connecter',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
      // Réinitialiser le formulaire
      setRegisterData({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Une erreur est survenue lors de la création du compte',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" py={20}>
      <Container maxW="lg">
        <Card>
          <CardBody p={8}>
            <VStack spacing={8}>
              <Heading size="lg" color="brand.500">
                Gestion des Abonnés
              </Heading>
              <Text color="gray.600">
                Connectez-vous pour accéder à votre espace
              </Text>
              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired isInvalid={errors.email}>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                    />
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>
                  <FormControl isRequired isInvalid={errors.password}>
                    <FormLabel>Mot de passe</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Votre mot de passe"
                      />
                      <InputRightElement>
                        <IconButton
                          variant="ghost"
                          aria-label={showPassword ? 'Masquer' : 'Afficher'}
                          icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                          onClick={() => setShowPassword(!showPassword)}
                        />
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  </FormControl>
                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    width="100%"
                    isLoading={loading}
                  >
                    Se connecter
                  </Button>
                  
                </VStack>
              </form>
            </VStack>
          </CardBody>
        </Card>
      </Container>

    </Box>
  );
} 