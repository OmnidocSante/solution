import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import DocumentManager from './DocumentManager';

const AbonneDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [abonne, setAbonne] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [openConjoint, setOpenConjoint] = useState(false);
  const [openEnfant, setOpenEnfant] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    dateNaissance: null,
    dateMariage: null
  });

  const fetchAbonne = async () => {
    try {
      const response = await axios.get(`/api/abonnes/${id}`);
      setAbonne(response.data);
    } catch (error) {
      toast.error('Erreur lors de la récupération des données de l\'abonné');
      navigate('/abonnes');
    }
  };

  useEffect(() => {
    fetchAbonne();
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenConjoint = () => {
    setFormData({
      nom: '',
      prenom: '',
      dateNaissance: null,
      dateMariage: null
    });
    setOpenConjoint(true);
  };

  const handleOpenEnfant = () => {
    setFormData({
      nom: '',
      prenom: '',
      dateNaissance: null
    });
    setOpenEnfant(true);
  };

  const handleClose = () => {
    setOpenConjoint(false);
    setOpenEnfant(false);
  };

  const handleSubmitConjoint = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/abonnes/${id}/conjoint`, formData);
      toast.success('Conjoint ajouté avec succès');
      handleClose();
      fetchAbonne();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du conjoint');
    }
  };

  const handleSubmitEnfant = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/abonnes/${id}/enfants`, formData);
      toast.success('Enfant ajouté avec succès');
      handleClose();
      fetchAbonne();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de l\'enfant');
    }
  };

  const handleDeleteConjoint = async (conjointId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce conjoint ?')) {
      try {
        await axios.delete(`/api/abonnes/${id}/conjoint/${conjointId}`);
        toast.success('Conjoint supprimé avec succès');
        fetchAbonne();
      } catch (error) {
        toast.error('Erreur lors de la suppression du conjoint');
      }
    }
  };

  const handleDeleteEnfant = async (enfantId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet enfant ?')) {
      try {
        await axios.delete(`/api/abonnes/${id}/enfants/${enfantId}`);
        toast.success('Enfant supprimé avec succès');
        fetchAbonne();
      } catch (error) {
        toast.error('Erreur lors de la suppression de l\'enfant');
      }
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await axios.post(`/api/rapports/pdf/abonne/${id}`, null, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `abonne-${id}-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  if (!abonne) {
    return null;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h4" gutterBottom>
                {abonne.nom} {abonne.prenom}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Numéro: {abonne.numero}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Statut: {abonne.statut}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Agence: {abonne.agence}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
              <Button
                variant="contained"
                startIcon={<PdfIcon />}
                onClick={handleExportPDF}
                sx={{ mb: 2 }}
              >
                Exporter PDF
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Informations" />
            <Tab label="Conjoint" />
            <Tab label="Enfants" />
            <Tab label="Documents" />
          </Tabs>

          <Box sx={{ mt: 3 }}>
            {activeTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Informations personnelles
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Date de naissance"
                        secondary={new Date(abonne.dateNaissance).toLocaleDateString()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Adresse"
                        secondary={abonne.adresse}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Téléphone"
                        secondary={abonne.telephone}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Email"
                        secondary={abonne.email}
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            )}

            {activeTab === 1 && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenConjoint}
                  >
                    Ajouter un conjoint
                  </Button>
                </Box>
                <List>
                  {abonne.conjoints?.map((conjoint) => (
                    <React.Fragment key={conjoint.id}>
                      <ListItem
                        secondaryAction={
                          <IconButton
                            edge="end"
                            color="error"
                            onClick={() => handleDeleteConjoint(conjoint.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={`${conjoint.nom} ${conjoint.prenom}`}
                          secondary={`Date de naissance: ${new Date(
                            conjoint.dateNaissance
                          ).toLocaleDateString()}, Date de mariage: ${new Date(
                            conjoint.dateMariage
                          ).toLocaleDateString()}`}
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </>
            )}

            {activeTab === 2 && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenEnfant}
                  >
                    Ajouter un enfant
                  </Button>
                </Box>
                <List>
                  {abonne.enfants?.map((enfant) => (
                    <React.Fragment key={enfant.id}>
                      <ListItem
                        secondaryAction={
                          <IconButton
                            edge="end"
                            color="error"
                            onClick={() => handleDeleteEnfant(enfant.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={`${enfant.nom} ${enfant.prenom}`}
                          secondary={`Date de naissance: ${new Date(
                            enfant.dateNaissance
                          ).toLocaleDateString()}`}
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </>
            )}

            {activeTab === 3 && <DocumentManager abonneId={id} />}
          </Box>
        </Paper>

        {/* Dialog pour ajouter un conjoint */}
        <Dialog open={openConjoint} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>Ajouter un conjoint</DialogTitle>
          <form onSubmit={handleSubmitConjoint}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nom"
                    value={formData.nom}
                    onChange={(e) =>
                      setFormData({ ...formData, nom: e.target.value })
                    }
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    value={formData.prenom}
                    onChange={(e) =>
                      setFormData({ ...formData, prenom: e.target.value })
                    }
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Date de naissance"
                    value={formData.dateNaissance}
                    onChange={(date) =>
                      setFormData({ ...formData, dateNaissance: date })
                    }
                    renderInput={(params) => (
                      <TextField {...params} fullWidth required />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Date de mariage"
                    value={formData.dateMariage}
                    onChange={(date) =>
                      setFormData({ ...formData, dateMariage: date })
                    }
                    renderInput={(params) => (
                      <TextField {...params} fullWidth required />
                    )}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Annuler</Button>
              <Button type="submit" variant="contained">
                Ajouter
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Dialog pour ajouter un enfant */}
        <Dialog open={openEnfant} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>Ajouter un enfant</DialogTitle>
          <form onSubmit={handleSubmitEnfant}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nom"
                    value={formData.nom}
                    onChange={(e) =>
                      setFormData({ ...formData, nom: e.target.value })
                    }
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    value={formData.prenom}
                    onChange={(e) =>
                      setFormData({ ...formData, prenom: e.target.value })
                    }
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <DatePicker
                    label="Date de naissance"
                    value={formData.dateNaissance}
                    onChange={(date) =>
                      setFormData({ ...formData, dateNaissance: date })
                    }
                    renderInput={(params) => (
                      <TextField {...params} fullWidth required />
                    )}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Annuler</Button>
              <Button type="submit" variant="contained">
                Ajouter
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AbonneDetail; 