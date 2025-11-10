const jwt = require("jsonwebtoken");
const Usuario = require('../models/usuarioModel');

const authMiddleware = (roles = []) => {
  if (typeof roles === "string") roles = [roles];
  return (req, res, next) => {


    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No autorizado" });

    const token = authHeader.split(" ")[1];
    console.log("🔑 Token recibido:", token);

    if (!token) return res.status(401).json({ message: "No autorizado" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secreto");
      req.user = decoded;
      //console.log("🧬 Token decodificado:", decoded);

      // Validación de roles
      if (roles.length) {
        const usuarioRol = req.user.rol;
        if (Array.isArray(usuarioRol)) {
          const tieneRol = usuarioRol.some(r => roles.includes(r));
          if (!tieneRol) return res.status(403).json({ message: "Acceso denegado" });
        } else {
          if (!roles.includes(usuarioRol)) return res.status(403).json({ message: "Acceso denegado" });
        }
      }

      next();
    } catch (error) {
      console.error("Error al verificar token:", error);
      return res.status(401).json({ message: "Token inválido", detalle: error.message });
    }

  };
};

module.exports = authMiddleware;
