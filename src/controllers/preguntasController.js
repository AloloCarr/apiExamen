const sql = require('mssql')

async function agregarPregunta(req, res) {
    const { pregunta, respuestaCorrectaIndex, respuestas } = req.body;
  
    try {
      const respuesta_correcta = respuestas[respuestaCorrectaIndex];
  
      const pool = await sql.connect();
      const result = await pool.request()
        .input('pregunta', pregunta)
        .input('respuesta_correcta', respuesta_correcta)
        .query('INSERT INTO Preguntas (pregunta, respuesta_correcta) OUTPUT INSERTED.id VALUES (@pregunta, @respuesta_correcta)');
  
      const preguntaId = result.recordset[0].id;
  
      for (const respuesta of respuestas) {
        await pool.request()
          .input('pregunta_id', preguntaId)
          .input('respuesta', respuesta)
          .query('INSERT INTO Respuestas (pregunta_id, respuesta) VALUES (@pregunta_id, @respuesta)');
      }
  
      res.status(201).send('Pregunta agregada con éxito');
    } catch (err) {
      res.status(500).send(err.message);
    }
  }

  async function obtenerPreguntas(req, res) {
    try {
      const pool = await sql.connect();
      const result = await pool.request().query(`
        SELECT TOP 10 * FROM Preguntas ORDER BY NEWID();
      `);
      const preguntas = result.recordset;
  
      for (const pregunta of preguntas) {
        const respuestasResult = await pool.request()
          .input('pregunta_id', pregunta.id)
          .query('SELECT respuesta FROM Respuestas WHERE pregunta_id = @pregunta_id');
        pregunta.respuestas = respuestasResult.recordset.map(r => r.respuesta);
      }
  
      res.json(preguntas);
    } catch (err) {
      res.status(500).send(err.message);
    }
  }

  async function obtenerTodasPreguntas(req, res) {
    try {
      const pool = await sql.connect();
      const result = await pool.request().query(`
        SELECT* FROM Preguntas ORDER BY id DESC;
      `);
      const preguntas = result.recordset;
  
      for (const pregunta of preguntas) {
        const respuestasResult = await pool.request()
          .input('pregunta_id', pregunta.id)
          .query('SELECT respuesta FROM Respuestas WHERE pregunta_id = @pregunta_id');
        pregunta.respuestas = respuestasResult.recordset.map(r => r.respuesta);
      }
  
      res.json(preguntas);
    } catch (err) {
      res.status(500).send(err.message);
    }
  }

  async function validarRespuesta(req, res) {
    const { preguntaId, respuestaIndex } = req.body;
  
    try {
      const pool = await sql.connect();
      const preguntaResult = await pool.request()
        .input('id', preguntaId)
        .query('SELECT respuesta_correcta FROM Preguntas WHERE id = @id');
  
      const respuestaCorrecta = preguntaResult.recordset[0].respuesta_correcta;
  
      const respuestasResult = await pool.request()
        .input('pregunta_id', preguntaId)
        .query('SELECT respuesta FROM Respuestas WHERE pregunta_id = @pregunta_id');
      const respuestas = respuestasResult.recordset.map(r => r.respuesta);
  
      const esCorrecta = respuestas[respuestaIndex] === respuestaCorrecta;
  
      const mensaje = esCorrecta ? 'Respuesta correcta' : 'Respuesta incorrecta';
  
      res.json({ esCorrecta, respuestaCorrecta, mensaje });
    } catch (err) {
      res.status(500).send(err.message);
    }
  }
  module.exports = {
    agregarPregunta,
    obtenerPreguntas,
    validarRespuesta,
    obtenerTodasPreguntas
  }