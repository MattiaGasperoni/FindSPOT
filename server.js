const express = require('express');
const fs = require('fs');
const path = require('path');

const app  = express();
const port = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'parcheggi.geojson');

app.use(express.static('public'));

/*Aggiunta dei parcheggi*/

// Middleware per leggere JSON nel body
app.use(express.json());

app.get('/api/parcheggi', (req, res) => {
  res.sendFile(DATA_FILE);
});

app.post('/api/parcheggi', (req, res) => {
  const newFeature = req.body;

  // Validazione base
  if (!newFeature || !newFeature.type || !newFeature.geometry) {
    return res.status(400).send('Feature non valida');
  }

  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Errore nel leggere il file');

    let geojson;
    try {
      geojson = JSON.parse(data);
    } catch (e) {
      return res.status(500).send('Errore nel parsing del file GeoJSON');
    }

    geojson.features.push(newFeature);

    fs.writeFile(DATA_FILE, JSON.stringify(geojson, null, 2), (err) => {
      if (err) return res.status(500).send('Errore nel salvare il file');

      res.status(201).send('Parcheggio aggiunto con successo');
    });
  });
});


/*Rimozione dei parcheggi*/
app.delete('/api/parcheggi/:id', (req, res) => {
  const idToDelete = req.params.id;

  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Errore nel leggere il file');

    let geojson;
    try {
      geojson = JSON.parse(data);
    } catch (e) {
      return res.status(500).send('Errore nel parsing del file GeoJSON');
    }

    const featuresBefore = geojson.features.length;
    geojson.features = geojson.features.filter(f => f.properties['@id'] !== idToDelete);

    if (geojson.features.length === featuresBefore) {
      return res.status(404).send('Parcheggio non trovato');
    }

    fs.writeFile(DATA_FILE, JSON.stringify(geojson, null, 2), (err) => {
      if (err) return res.status(500).send('Errore nel salvare il file');

      res.send('Parcheggio eliminato');
    });
  });
});

/* Avvio del server */
app.listen(port, () => {
  console.log(`Per visualizzare il sito, apri http://localhost:${port}`);
});
