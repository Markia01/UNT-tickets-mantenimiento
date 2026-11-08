require('dotenv').config();

const path = require('path');
const express = require('express');
const conectarDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Vistas con EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Archivos estáticos y lectura de formularios
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.get('/', (req, res) => {
  res.render('index', { titulo: 'Tickets de Mantenimiento UTN' });
});

// Primero se conecta a la base de datos y después se inicia el servidor
conectarDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo conectar a MongoDB:', error.message);
    process.exit(1);
  });
