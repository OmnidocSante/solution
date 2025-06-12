// Middleware pour vérifier les rôles des utilisateurs
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Accès refusé. Vous n\'avez pas les permissions nécessaires.' 
      });
    }

    next();
  };
};

module.exports = roleMiddleware; 