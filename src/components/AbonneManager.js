import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

const AbonneManager = () => {
  const navigate = useNavigate();
  const [abonnes, setAbonnes] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedAbonne, setSelectedAbonne] = useState(null);
  const [formData, setFormData] = useState({
    numero: '',
    nom: '',
    prenom: '',
    dateNaissance: null,
    adresse: '',
    telephone: '',
    email: '',
    statut: 'actif',
    agence: ''
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchAbonnes = async () => {
    try {
      const response = await axios.get('/api/abonnes');
      setAbonnes(response.data);
    } catch (error) {
      toast.error('Erreur lors de la récupération des abonnés');
    }
  };

  useEffect(() => {
    fetchAbonnes();
  }, []);

  const handleOpen = (abonne = null) => {
    if (abonne) {
      setSelectedAbonne(abonne);
      setFormData({
        ...abonne,
        dateNaissance: new Date(abonne.dateNaissance)
      });
    } else {
      setSelectedAbonne(null);
      setFormData({
        numero: '',
        nom: '',
        prenom: '',
        dateNaissance: null,
        adresse: '',
        telephone: '',
        email: '',
        statut: 'actif',
        agence: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedAbonne(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedAbonne) {
        await axios.put(`/api/abonnes/${selectedAbonne.id}`, formData);
        toast.success('Abonné mis à jour avec succès');
      } else {
        await axios.post('/api/abonnes', formData);
        toast.success('Abonné créé avec succès');
      }
      handleClose();
      fetchAbonnes();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde de l\'abonné');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet abonné ?')) {
      try {
        await axios.delete(`/api/abonnes/${id}`);
        toast.success('Abonné supprimé avec succès');
        fetchAbonnes();
      } catch (error) {
        toast.error('Erreur lors de la suppression de l\'abonné');
      }
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Nouvel Abonné
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Numéro</TableCell>
                <TableCell>Nom</TableCell>
                <TableCell>Prénom</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Agence</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {abonnes
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((abonne) => (
                  <TableRow key={abonne.id}>
                    <TableCell>{abonne.numero}</TableCell>
                    <TableCell>{abonne.nom}</TableCell>
                    <TableCell>{abonne.prenom}</TableCell>
                    <TableCell>{abonne.statut}</TableCell>
                    <TableCell>{abonne.agence}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/abonnes/${abonne.id}`)}
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={() => handleOpen(abonne)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(abonne.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={abonnes.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>

        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedAbonne ? 'Modifier l\'abonné' : 'Nouvel abonné'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Numéro"
                    value={formData.numero}
                    onChange={(e) =>
                      setFormData({ ...formData, numero: e.target.value })
                    }
                    required
                  />
                </Grid>
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
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Adresse"
                    value={formData.adresse}
                    onChange={(e) =>
                      setFormData({ ...formData, adresse: e.target.value })
                    }
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Téléphone"
                    value={formData.telephone}
                    onChange={(e) =>
                      setFormData({ ...formData, telephone: e.target.value })
                    }
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Statut</InputLabel>
                    <Select
                      value={formData.statut}
                      onChange={(e) =>
                        setFormData({ ...formData, statut: e.target.value })
                      }
                      label="Statut"
                      required
                    >
                      <MenuItem value="actif">Actif</MenuItem>
                      <MenuItem value="inactif">Inactif</MenuItem>
                      <MenuItem value="suspendu">Suspendu</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Agence</InputLabel>
                    <Select
                      value={formData.agence}
                      onChange={(e) =>
                        setFormData({ ...formData, agence: e.target.value })
                      }
                      label="Agence"
                      required
                    >
                      <MenuItem value="Agence 1">Agence 1</MenuItem>
                      <MenuItem value="Agence 2">Agence 2</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Annuler</Button>
              <Button type="submit" variant="contained">
                {selectedAbonne ? 'Modifier' : 'Créer'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AbonneManager; 