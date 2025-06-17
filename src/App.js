import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, CSSReset } from '@chakra-ui/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import theme from './theme';

// Layout
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Abonnes from './pages/Abonnes';
import AbonneDetails from './pages/AbonneDetails';
import AbonneForm from './pages/AbonneForm';
import Users from './pages/Users';
import UserForm from './pages/UserForm';
import Rapports from './pages/Rapports';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import EnfantForm from './pages/EnfantForm';
import ConjointForm from './pages/ConjointForm';

// Protected Route Component
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // Affiche un loader pendant la vérification du token
    return <div>Chargement...</div>;
  }

  if (!user) {
    // Redirige vers login si pas connecté
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    // Redirige si le rôle ne correspond pas
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

function App() {
  return (
    <ChakraProvider theme={theme}>
      <CSSReset />
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Routes protégées avec Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                  <Abonnes />
                  </Layout>
                </ProtectedRoute>
              }
            />
   
            <Route
              path="/abonnes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Abonnes />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/abonnes/add"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AbonneForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/abonnes/edit/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AbonneForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/abonnes/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AbonneDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/abonnes/:id/fichiers"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AbonneDetails activeTab="fichiers" />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Routes pour les enfants */}
            <Route
              path="/enfants/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnfantForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/enfants/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnfantForm />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Routes pour les conjoints */}
            <Route
              path="/conjoints/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ConjointForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/conjoints/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ConjointForm />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Routes protégées - Admin uniquement */}
            <Route
              path="/users"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Layout>
                    <Users />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/add"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Layout>
                    <UserForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/edit/:id"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Layout>
                    <UserForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rapports"
              element={
                <ProtectedRoute roles={['admin', 'controleur']}>
                  <Layout>
                    <Rapports />
                  </Layout>
                </ProtectedRoute>
              }
            />
         

            {/* Route 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App; 