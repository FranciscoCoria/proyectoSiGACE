const jwt = require('jsonwebtoken');
const SECRET = 'sigace_secret_key';

const verificarToken = (req, res, next) => {                //intercepta la petición y busca el token en el header Authorization.
  const authHeader = req.headers['authorization'];          //El token llega en el formato Bearer eyJ...,
  const token = authHeader && authHeader.split(' ')[1];     //por eso hace el split(' ')[1] para quedarse solo con el token.

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.usuario = decoded;                   //Si el token es válido, guarda los datos del usuario en req.usuario y llama a next()
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

const verificarRol = (...roles) => {      //es un middleware que recibe una lista de roles permitidos
  return (req, res, next) => {            // y verifica que el usuario tenga uno de esos roles.
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'No tenés permisos para realizar esta acción.' });
    }
    next();
  };
};

module.exports = { verificarToken, verificarRol };