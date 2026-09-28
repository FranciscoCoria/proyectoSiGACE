

const express = require('express');
const cors = require('cors');  // permite que el frontend (que va a correr en otro puerto) pueda hablarle al backend sin que el navegador lo bloquee por seguridad.

const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes); // conecta las rutas de autenticación. 
                                  // Cuando llegue cualquier petición a /api/auth/... se va a manejar con el archivo authRoutes.js. 
                                  // Entonces el login queda en /api/auth/login.
app.use('/api/usuarios', usuarioRoutes);

                                  
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});