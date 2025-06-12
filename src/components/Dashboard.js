import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { PictureAsPdf as PdfIcon } from '@mui/icons-material';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  const [statistiques, setStatistiques] = useState(null);
  const [abonnes, setAbonnes] = useState([]);
  const [filters, setFilters] = useState({
    agence: '',
    statut: '',
    dateDebut: null,
    dateFin: null,
    search: ''
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);

  const fetchStatistiques = async () => {
    try {
      const response = await axios.get('/api/rapports/statistiques');
      setStatistiques(response.data);
    } catch (error) {
      toast.error('Erreur lors de la récupération des statistiques');
    }
  };

  const fetchAbonnes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.agence) params.append('agence', filters.agence);
      if (filters.statut) params.append('statut', filters.statut);
      if (filters.dateDebut) params.append('dateDebut', filters.dateDebut.toISOString());
      if (filters.dateFin) params.append('dateFin', filters.dateFin.toISOString());
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`/api/rapports/abonnes?${params.toString()}`);
      setAbonnes(response.data);
    } catch (error) {
      toast.error('Erreur lors de la récupération des abonnés');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistiques();
  }, []);

  useEffect(() => {
    fetchAbonnes();
  }, [filters]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExportPDF = async () => {
    try {
      const response = await axios.post('/api/rapports/pdf/rapport', filters, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapport-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Filtres */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Rechercher"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Agence</InputLabel>
                    <Select
                      value={filters.agence}
                      onChange={(e) => setFilters({ ...filters, agence: e.target.value })}
                      label="Agence"
                    >
                      <MenuItem value="">Toutes</MenuItem>
                      <MenuItem value="Agence 1">Agence 1</MenuItem>
                      <MenuItem value="Agence 2">Agence 2</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Statut</InputLabel>
                    <Select
                      value={filters.statut}
                      onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
                      label="Statut"
                    >
                      <MenuItem value="">Tous</MenuItem>
                      <MenuItem value="actif">Actif</MenuItem>
                      <MenuItem value="inactif">Inactif</MenuItem>
                      <MenuItem value="suspendu">Suspendu</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Date début"
                    value={filters.dateDebut}
                    onChange={(date) => setFilters({ ...filters, dateDebut: date })}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Date fin"
                    value={filters.dateFin}
                    onChange={(date) => setFilters({ ...filters, dateFin: date })}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="contained"
                    startIcon={<PdfIcon />}
                    onClick={handleExportPDF}
                    fullWidth
                  >
                    Exporter PDF
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Statistiques */}
          {statistiques && (
            <>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Répartition par statut
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statistiques.statuts}
                          dataKey="count"
                          nameKey="statut"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {statistiques.statuts.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Évolution mensuelle
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={statistiques.abonnesParMois}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mois" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#8884d8" name="Nombre d'abonnés" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          {/* Liste des abonnés */}
          <Grid item xs={12}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Numéro</TableCell>
                    <TableCell>Nom</TableCell>
                    <TableCell>Prénom</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Agence</TableCell>
                    <TableCell>Date d'inscription</TableCell>
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
                          {new Date(abonne.date_inscription).toLocaleDateString()}
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
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default Dashboard; 