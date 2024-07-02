const express = require('express');
const config = require('./config');

const morgan = require('morgan');
const cors = require('cors')

const preguntas = require('./routes/preguntas')

//configuracion
const app = express();

app.set('port', config.app.port);

//middlewares

app.use(morgan('dev'));
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true}))

//rutas
app.use('/api', preguntas)

//para ver si funciona la api
app.get('/', (req, res) =>{
    res.status(200).send('api corriendo Ok!')

})

module.exports = app;

