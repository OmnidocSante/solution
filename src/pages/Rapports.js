import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Select,
  VStack,
  Heading,
  useToast,
  useColorModeValue,
  Grid,
  GridItem,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Divider
} from '@chakra-ui/react';
import api from '../services/api';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

const Rapports = () => {
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [loading, setLoading] = useState(false);
  const [typeRapport, setTypeRapport] = useState('journalier');
  const [periode, setPeriode] = useState('');
  const [ville, setVille] = useState('');
  const [utilisateur, setUtilisateur] = useState('');
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [villes, setVilles] = useState([]);
  const [abonnes, setAbonnes] = useState([]);
  const [statistiques, setStatistiques] = useState({
    totalAbonnes: 0,
    nouveauxAbonnes: 0,
    abonnesParVille: {}
  });

  useEffect(() => {
    fetchUtilisateurs();
    fetchAbonnes();
  }, []);

  const fetchUtilisateurs = async () => {
    try {
      const response = await api.get('/users');
      setUtilisateurs(response.data);
      // Extraire les villes uniques des utilisateurs et les trier
      const uniqueVilles = [...new Set(response.data
        .map(user => user.ville ? user.ville.trim().toUpperCase() : '')
        .filter(ville => ville !== '')
      )].sort();
      setVilles(uniqueVilles);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
    }
  };

  const fetchAbonnes = async () => {
    try {
      const response = await api.get('/abonnes');
      setAbonnes(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des abonnés:', error);
    }
  };

  const formatDateToSQL = (date) => {
    // Si la date est une chaîne ISO, la convertir en objet Date
    const d = typeof date === 'string' ? new Date(date) : date;
    
    // Extraire uniquement la partie date (YYYY-MM-DD)
    const dateStr = d.toISOString().split('T')[0];
    
    return dateStr;
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getPeriodeDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let debut, fin;

    switch (periode) {
      case 'aujourdhui':
        debut = today;
        fin = today;
        break;

      case 'hier':
        debut = new Date(today);
        debut.setDate(debut.getDate() - 1);
        fin = new Date(debut);
        break;

      case 'cette_semaine':
        debut = new Date(today);
        debut.setDate(debut.getDate() - debut.getDay() + 1);
        fin = new Date(today);
        break;

      case 'semaine_derniere':
        debut = new Date(today);
        debut.setDate(debut.getDate() - debut.getDay() - 6);
        fin = new Date(debut);
        fin.setDate(fin.getDate() + 6);
        break;

      case 'ce_mois':
        debut = new Date(today.getFullYear(), today.getMonth(), 1);
        fin = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;

      case 'mois_dernier':
        debut = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        fin = new Date(today.getFullYear(), today.getMonth(), 0);
        break;

      default:
        return null;
    }

    // Convertir les dates en format SQL
    const debutSQL = formatDateToSQL(debut);
    const finSQL = formatDateToSQL(fin);

    console.log('Période calculée:', {
      type: periode,
      debut: debutSQL,
      fin: finSQL
    });

    return { debut: debutSQL, fin: finSQL };
  };

  const filtrerAbonnes = () => {
    const dates = getPeriodeDates();
    if (!dates) return [];

    console.log('Dates de filtrage:', dates);

    return abonnes.filter(abonne => {
      // Vérifier si l'abonné a une date
      if (!abonne.date_debut) {
        console.log('Abonné sans date:', abonne);
        return false;
      }

      // Convertir la date de l'abonné en format YYYY-MM-DD
      const dateObj = new Date(abonne.date_debut);
      const dateAbonne = formatDateToSQL(dateObj);
      
      // Trouver l'utilisateur qui a créé l'abonné
      const user = utilisateurs.find(u => Number(u.id) === Number(abonne.user_id));
      
      console.log('Comparaison des dates pour abonné:', {
        id: abonne.id,
        nom: abonne.nom,
        dateAbonne: dateAbonne,
        debut: dates.debut,
        fin: dates.fin,
        matchDate: dateAbonne >= dates.debut && dateAbonne <= dates.fin,
        user_id: abonne.user_id,
        utilisateur: utilisateur,
        userVille: user?.ville,
        ville: ville
      });

      // Si aucune période n'est sélectionnée, retourner tous les abonnés
      if (!periode) return true;

      const matchDate = dateAbonne >= dates.debut && dateAbonne <= dates.fin;
      const matchVille = !ville || (user?.ville && user.ville.trim().toUpperCase() === ville.trim().toUpperCase());
      const matchUtilisateur = !utilisateur || Number(abonne.user_id) === Number(utilisateur);

      return matchDate && matchVille && matchUtilisateur;
    });
  };

  const calculerStatistiques = () => {
    const abonnesFiltres = filtrerAbonnes();
    const abonnesParVille = {};

    // Si aucun filtre n'est appliqué, utiliser tous les abonnés
    const abonnesToCount = periode ? abonnesFiltres : abonnes;

    abonnesToCount.forEach(abonne => {
      const user = utilisateurs.find(u => Number(u.id) === Number(abonne.user_id));
      if (user?.ville) {
        // Normaliser le nom de la ville (majuscules et espaces)
        const villeNormalisee = user.ville.trim().toUpperCase();
        abonnesParVille[villeNormalisee] = (abonnesParVille[villeNormalisee] || 0) + 1;
      }
    });

    setStatistiques({
      totalAbonnes: abonnesToCount.length,
      nouveauxAbonnes: abonnesFiltres.length,
      abonnesParVille
    });
  };

  useEffect(() => {
    if (periode) {
      calculerStatistiques();
    }
  }, [periode, ville, utilisateur, abonnes]);

  const getUserInfo = (userId) => {
    const user = utilisateurs.find(u => Number(u.id) === Number(userId));
    if (!user) return { nom: 'N/A', agence: 'N/A', ville: 'N/A' };
    
    return {
      nom: `${user.nom} ${user.prenom}`,
      agence: user.agence || 'N/A',
      ville: user.ville || 'N/A'
    };
  };

  const genererPDF = () => {
    try {
      // Vérifier si les données sont disponibles
      const abonnesFiltres = filtrerAbonnes();
      if (!abonnesFiltres || abonnesFiltres.length === 0) {
        throw new Error('Aucun abonné trouvé pour cette période');
      }

      const dates = getPeriodeDates();
      if (!dates) {
        throw new Error('Période invalide');
      }

      // Créer le document PDF
      const doc = new jsPDF();

      // Titre
      doc.setFontSize(16);
      doc.text('Rapport des Abonnés', 14, 20);

      // Informations du rapport
      doc.setFontSize(12);
      doc.text(`Type: ${typeRapport}`, 14, 30);
      doc.text(`Période: du ${formatDate(dates.debut)} au ${formatDate(dates.fin)}`, 14, 40);
      if (ville) doc.text(`Ville: ${ville}`, 14, 50);

      // Statistiques
      doc.text('Statistiques:', 14, 65);
      doc.text(`Total des abonnés: ${statistiques.totalAbonnes}`, 20, 75);

      // Tableau récapitulatif des villes
      const villesData = Object.entries(statistiques.abonnesParVille).map(([nomVille, nombre]) => [
        nomVille,
        nombre.toString(),
        `${((nombre / statistiques.totalAbonnes) * 100).toFixed(1)}%`
      ]);

      // Configuration du tableau des villes
      const villesTableConfig = {
        startY: 90,
        head: [['Ville', 'Nombre d\'abonnés', 'Pourcentage']],
        body: villesData,
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 12,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 11
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: 20 }
      };

      // Générer le tableau des villes
      autoTable(doc, villesTableConfig);

      // Préparer les données du tableau principal
      const tableData = abonnesFiltres.map(abonne => {
        const userInfo = getUserInfo(abonne.user_id);
        return [
          abonne.telephone || '',
          abonne.nom || '',
          abonne.prenom || '',
          abonne.ville || '',
          abonne.date_debut ? formatDate(abonne.date_debut) : '',
          userInfo.nom,
          userInfo.agence,
          userInfo.ville
        ];
      });

      // Configuration du tableau principal
      const tableConfig = {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Téléphone', 'Nom', 'Prénom', 'Ville', 'Date début', 'Créé par', 'Agence', 'Ville Agent']],
        body: tableData,
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 12,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 11
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: 20 },
        didDrawPage: function(data) {
          // Ajouter un pied de page
          doc.setFontSize(10);
          doc.text(
            `Page ${data.pageNumber}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );
        }
      };

      // Générer le tableau
      autoTable(doc, tableConfig);

      // Enregistrer le PDF
      const filename = `rapport_${typeRapport}_${periode}_${formatDateToSQL(new Date())}.pdf`;
      doc.save(filename);

      return true;
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      throw new Error(error.message || 'Erreur lors de la génération du PDF');
    }
  };

  const handleGenerateReport = () => {
    setLoading(true);
    try {
      if (!periode) {
        throw new Error('Veuillez sélectionner une période');
      }

      const success = genererPDF();
      if (success) {
        toast({
          title: 'Succès',
          description: 'Rapport généré avec succès',
          status: 'success',
          duration: 5000,
          isClosable: true
        });
      }
    } catch (error) {
      console.error('Erreur complète:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la génération du rapport',
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
            <Heading size="lg">Génération de Rapports</Heading>
            <Text color="gray.600">
              Générez des rapports détaillés sur les abonnés par ville
            </Text>

            <Divider />

            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <GridItem>
                <FormControl>
                  <FormLabel>Type de Rapport</FormLabel>
                  <Select
                    value={typeRapport}
                    onChange={(e) => setTypeRapport(e.target.value)}
                  >
                    <option value="journalier">Rapport journalier des abonnés par ville</option>
                    <option value="hebdomadaire">Rapport hebdomadaire des abonnés par ville</option>
                    <option value="mensuel">Rapport mensuel des abonnés par ville</option>
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel>Période</FormLabel>
                  <Select
                    value={periode}
                    onChange={(e) => setPeriode(e.target.value)}
                  >
                    <option value="">Sélectionner une période</option>
                    {typeRapport === 'journalier' && (
                      <>
                        <option value="aujourdhui">Aujourd'hui</option>
                        <option value="hier">Hier</option>
                      </>
                    )}
                    {typeRapport === 'hebdomadaire' && (
                      <>
                        <option value="cette_semaine">Cette semaine</option>
                        <option value="semaine_derniere">Semaine dernière</option>
                      </>
                    )}
                    {typeRapport === 'mensuel' && (
                      <>
                        <option value="ce_mois">Ce mois</option>
                        <option value="mois_dernier">Mois dernier</option>
                      </>
                    )}
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel>Ville</FormLabel>
                  <Select
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    placeholder="Toutes les villes"
                  >
                    {villes.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel>Utilisateur</FormLabel>
                  <Select
                    value={utilisateur}
                    onChange={(e) => setUtilisateur(e.target.value)}
                    placeholder="Tous les utilisateurs"
                  >
                    {utilisateurs.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.nom} {user.prenom}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
            </Grid>

            {periode && (
              <>
                <Divider />
                <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                  <GridItem>
                    <Stat>
                      <StatLabel>Total Abonnés</StatLabel>
                      <StatNumber>{statistiques.totalAbonnes}</StatNumber>
                      <StatHelpText>
                        <StatArrow type="increase" />
                        {statistiques.nouveauxAbonnes} nouveaux
                      </StatHelpText>
                    </Stat>
                  </GridItem>

             
                </Grid>

                {statistiques.abonnesParVille && Object.entries(statistiques.abonnesParVille).length > 0 && (
                  <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                    {Object.entries(statistiques.abonnesParVille).map(([nomVille, nombre]) => (
                      <GridItem key={nomVille}>
                        <Stat>
                          <StatLabel>{nomVille}</StatLabel>
                          <StatNumber>{nombre}</StatNumber>
                          <StatHelpText>
                            {statistiques.totalAbonnes > 0 
                              ? ((nombre / statistiques.totalAbonnes) * 100).toFixed(1)
                              : 0}% du total
                          </StatHelpText>
                        </Stat>
                      </GridItem>
                    ))}
                  </Grid>
                )}
              </>
            )}

            <Box display="flex" justifyContent="flex-end">
              <Button
                colorScheme="blue"
                onClick={handleGenerateReport}
                isLoading={loading}
                isDisabled={!periode}
              >
                Générer le Rapport PDF
              </Button>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default Rapports; 