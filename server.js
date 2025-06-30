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


// Endpoint per aggiungere un nuovo parcheggio
app.post('/api/parcheggi', (req, res) => {
  const newFeature = req.body;

  if (!newFeature.properties) newFeature.properties = {};

  if (!newFeature.geometry || !newFeature.geometry.coordinates) {
    return res.status(400).send('Feature con coordinate mancanti');
  }

  // Prendi le coordinate
  const coords = newFeature.geometry.coordinates;

  // Arrotonda a 6 decimali
  const lon = Number(coords[0]).toFixed(6);
  const lat = Number(coords[1]).toFixed(6);

  // Crea l'id concatenando lon e lat
  newFeature.properties['@id'] = `${lon}_${lat}`;

  // Leggi file geojson
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Errore nel leggere il file');

    let geojson;
    try {
      geojson = JSON.parse(data);
    } catch (e) {
      return res.status(500).send('Errore nel parsing del file GeoJSON');
    }
    console.log('Sto aggiungendo un parcheggio con id:', newFeature.properties['@id']); 

    geojson.features.push(newFeature);

    fs.writeFile(DATA_FILE, JSON.stringify(geojson, null, 2), (err) => {
      if (err) return res.status(500).send('Errore nel salvare il file');

      // Tutto ok: ritorna il nuovo id per conferma
      res.status(201).json({ message: 'Parcheggio aggiunto con successo', id: newFeature.properties['@id'] });
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
