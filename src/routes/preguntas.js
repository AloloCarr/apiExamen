const express = require('express');
const router = express.Router();

const preguntasController = require('../controllers/preguntasController')

router.post('/preguntas', preguntasController.agregarPregunta);
router.post('/validaRespuesta', preguntasController.validarRespuesta);
router.get('/preguntas', preguntasController.obtenerPreguntas);
router.get('/preguntas/todas', preguntasController.obtenerTodasPreguntas)


module.exports = router;