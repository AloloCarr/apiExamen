const sql = require("mssql");

async function agregarPregunta(req, res) {
  const { pregunta, respuestaCorrectaIndex, respuestas } = req.body;

  try {
    const respuesta_correcta = respuestas[respuestaCorrectaIndex];

    const pool = await sql.connect();
    const result = await pool
      .request()
      .input("pregunta", pregunta)
      .input("respuesta_correcta", respuesta_correcta)
      .query(
        "INSERT INTO Preguntas (pregunta, respuesta_correcta) OUTPUT INSERTED.id VALUES (@pregunta, @respuesta_correcta)"
      );

    const preguntaId = result.recordset[0].id;

    for (const respuesta of respuestas) {
      await pool
        .request()
        .input("pregunta_id", preguntaId)
        .input("respuesta", respuesta)
        .query(
          "INSERT INTO Respuestas (pregunta_id, respuesta) VALUES (@pregunta_id, @respuesta)"
        );
    }

    res.status(201).send("Pregunta agregada con éxito");
  } catch (err) {
    res.status(500).send(err.message);
  }
}

async function preguntasRandom(req, res) {
  try {
    const pool = await sql.connect();
    const result = await pool.request().query(`
        SELECT* FROM Preguntas 
      `);
    const preguntas = result.recordset;

    for (const pregunta of preguntas) {
      const respuestasResult = await pool
        .request()
        .input("pregunta_id", pregunta.id)
        .query(
          "SELECT respuesta FROM Respuestas WHERE pregunta_id = @pregunta_id"
        );
      pregunta.respuestas = respuestasResult.recordset.map((r) => r.respuesta);
    }

    // Mezclar y seleccionar 10 preguntas aleatorias
    const preguntasAleatorias = preguntas
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    res.json(preguntasAleatorias);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

async function obtenerPreguntas(req, res) {
  try {
    const pool = await sql.connect();
    const preguntasResult = await pool.request().query(`
      SELECT * FROM Preguntas ORDER BY id desc
    `);
    const preguntas = preguntasResult.recordset;
        const respuestasResult = await pool.request().query(`
      SELECT pregunta_id, respuesta FROM Respuestas
    `);
    const respuestas = respuestasResult.recordset;
    const respuestasPorPregunta = respuestas.reduce((acc, respuesta) => {
      if (!acc[respuesta.pregunta_id]) {
        acc[respuesta.pregunta_id] = [];
      }
      acc[respuesta.pregunta_id].push(respuesta.respuesta);
      return acc;
    }, {});

    preguntas.forEach(pregunta => {
      pregunta.respuestas = respuestasPorPregunta[pregunta.id] || [];
    });

    res.json(preguntas);
  } catch (err) {
    res.status(500).send(err.message);
  }
}


async function validarRespuesta(req, res) {
  const { preguntaId, respuestaIndex } = req.body;

  try {
    const pool = await sql.connect();
    const preguntaResult = await pool
      .request()
      .input("id", preguntaId)
      .query("SELECT respuesta_correcta FROM Preguntas WHERE id = @id");

    const respuestaCorrecta = preguntaResult.recordset[0].respuesta_correcta;

    const respuestasResult = await pool
      .request()
      .input("pregunta_id", preguntaId)
      .query(
        "SELECT respuesta FROM Respuestas WHERE pregunta_id = @pregunta_id"
      );
    const respuestas = respuestasResult.recordset.map((r) => r.respuesta);

    const esCorrecta = respuestas[respuestaIndex] === respuestaCorrecta;

    const mensaje = esCorrecta ? "Respuesta correcta" : "Respuesta incorrecta";

    res.json({ esCorrecta, respuestaCorrecta, mensaje });
  } catch (err) {
    res.status(500).send(err.message);
  }
}

module.exports = {
  agregarPregunta,
  validarRespuesta,
  preguntasRandom,
  obtenerPreguntas,
};
