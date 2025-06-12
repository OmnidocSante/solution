import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

const DocumentManager = () => {
  const { abonneId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [openUpload, setOpenUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [typeDocument, setTypeDocument] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`/api/documents/abonne/${abonneId}`);
      setDocuments(response.data);
    } catch (error) {
      toast.error('Erreur lors de la récupération des documents');
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [abonneId]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) { // 5MB
      setSelectedFile(file);
    } else {
      toast.error('Le fichier doit faire moins de 5MB');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !typeDocument) {
      toast.error('Veuillez sélectionner un fichier et un type de document');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('abonne_id', abonneId);
    formData.append('type_document', typeDocument);

    try {
      await axios.post('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Document uploadé avec succès');
      setOpenUpload(false);
      setSelectedFile(null);
      setTypeDocument('');
      fetchDocuments();
    } catch (error) {
      toast.error('Erreur lors de l\'upload du document');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      try {
        await axios.delete(`/api/documents/${documentId}`);
        toast.success('Document supprimé avec succès');
        fetchDocuments();
      } catch (error) {
        toast.error('Erreur lors de la suppression du document');
      }
    }
  };

  const handleView = (document) => {
    window.open(`/uploads/${document.nom_fichier}`, '_blank');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Documents</Typography>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setOpenUpload(true)}
        >
          Ajouter un document
        </Button>
      </Box>

      <Grid container spacing={3}>
        {documents.map((document) => (
          <Grid item xs={12} sm={6} md={4} key={document.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {document.type_document}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {document.nom_fichier}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(document.taille_fichier / 1024).toFixed(2)} KB
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton onClick={() => handleView(document)}>
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(document.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openUpload} onClose={() => setOpenUpload(false)}>
        <DialogTitle>Ajouter un document</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Type de document</InputLabel>
              <Select
                value={typeDocument}
                onChange={(e) => setTypeDocument(e.target.value)}
                label="Type de document"
              >
                <MenuItem value="cni">CNI</MenuItem>
                <MenuItem value="justificatif">Justificatif de domicile</MenuItem>
                <MenuItem value="contrat">Contrat</MenuItem>
                <MenuItem value="autre">Autre</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<UploadIcon />}
            >
              Sélectionner un fichier
              <input
                type="file"
                hidden
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
            </Button>
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Fichier sélectionné: {selectedFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUpload(false)}>Annuler</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={loading || !selectedFile || !typeDocument}
          >
            {loading ? 'Upload en cours...' : 'Uploader'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentManager; 