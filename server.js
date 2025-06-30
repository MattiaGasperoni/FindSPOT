const express = require('express');
const fs = require('fs');
const path = require('path');

// =============================================
// CONFIGURAZIONE SERVER
// =============================================

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'parcheggi.geojson');

// =============================================
// MIDDLEWARE
// =============================================

// Serve i file statici dalla cartella 'public'
app.use(express.static('public'));

// Middleware per parsare il JSON nel body delle richieste
app.use(express.json());

// =============================================
// FUNZIONI DI UTILITÀ
// =============================================

/**
 * Legge il file GeoJSON e restituisce i dati parsati
 * @param {Function} callback - Callback con (err, geojson)
 */
function readGeoJSONFile(callback) {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) {
      return callback(err, null);
    }

    try {
      const geojson = JSON.parse(data);
      callback(null, geojson);
    } catch (parseError) {
      callback(parseError, null);
    }
  });
}

/**
 * Scrive i dati GeoJSON nel file
 * @param {Object} geojson - Oggetto GeoJSON da salvare
 * @param {Function} callback - Callback con (err)
 */
function writeGeoJSONFile(geojson, callback) {
  const jsonString = JSON.stringify(geojson, null, 2);
  fs.writeFile(DATA_FILE, jsonString, callback);
}

/**
 * Genera un ID univoco basato sulle coordinate
 * @param {Array} coordinates - Array [longitude, latitude]
 * @returns {string} ID univoco nel formato "lon_lat"
 */
function generateParkingId(coordinates) {
  const [lon, lat] = coordinates;
  // Arrotonda a 6 decimali per evitare problemi di precisione
  const roundedLon = Number(lon).toFixed(6);
  const roundedLat = Number(lat).toFixed(6);
  return `${roundedLon}_${roundedLat}`;
}

/**
 * Valida una feature GeoJSON per un parcheggio
 * @param {Object} feature - Feature GeoJSON da validare
 * @returns {Object} { isValid: boolean, error: string }
 */
function validateParkingFeature(feature) {
  if (!feature.geometry || !feature.geometry.coordinates) {
    return { 
      isValid: false, 
      error: 'Feature con coordinate mancanti' 
    };
  }

  const coords = feature.geometry.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) {
    return { 
      isValid: false, 
      error: 'Coordinate non valide' 
    };
  }

  return { isValid: true };
}

// =============================================
// ENDPOINTS API
// =============================================

/**
 * GET /api/parcheggi
 * Restituisce tutti i parcheggi dal file GeoJSON
 */
app.get('/api/parcheggi', (req, res) => {
  // Invia direttamente il file GeoJSON
  res.sendFile(DATA_FILE, (err) => {
    if (err) {
      console.error('Errore nell\'invio del file GeoJSON:', err);
      res.status(500).json({ 
        error: 'Errore nel caricamento dei parcheggi' 
      });
    }
  });
});

/**
 * POST /api/parcheggi
 * Aggiunge un nuovo parcheggio al file GeoJSON
 */
app.post('/api/parcheggi', (req, res) => {
  const newFeature = req.body;

  // Inizializza le proprietà se non esistono
  if (!newFeature.properties) {
    newFeature.properties = {};
  }

  // Valida la feature
  const validation = validateParkingFeature(newFeature);
  if (!validation.isValid) {
    return res.status(400).json({ error: validation.error });
  }

  // Genera un ID univoco basato sulle coordinate
  const parkingId = generateParkingId(newFeature.geometry.coordinates);
  newFeature.properties['@id'] = parkingId;

  // Legge il file GeoJSON esistente
  readGeoJSONFile((err, geojson) => {
    if (err) {
      console.error('Errore nella lettura del file GeoJSON:', err);
      return res.status(500).json({ 
        error: 'Errore nel leggere i dati esistenti' 
      });
    }

    console.log('Aggiungendo parcheggio con ID:', parkingId);

    // Aggiunge la nuova feature
    geojson.features.push(newFeature);

    // Salva il file aggiornato
    writeGeoJSONFile(geojson, (writeErr) => {
      if (writeErr) {
        console.error('Errore nella scrittura del file GeoJSON:', writeErr);
        return res.status(500).json({ 
          error: 'Errore nel salvare il nuovo parcheggio' 
        });
      }

      // Successo: restituisce conferma con l'ID generato
      res.status(201).json({ 
        message: 'Parcheggio aggiunto con successo', 
        id: parkingId 
      });
    });
  });
});

/**
 * PUT /api/parcheggi/:id
 * Aggiorna le proprietà di un parcheggio esistente
 */
app.put('/api/parcheggi/:id', (req, res) => {
  const idToUpdate = req.params.id;
  const updatedProps = req.body;

  // Legge il file GeoJSON
  readGeoJSONFile((err, geojson) => {
    if (err) {
      console.error('Errore nella lettura del file GeoJSON:', err);
      return res.status(500).json({ 
        error: 'Errore nel leggere i dati' 
      });
    }

    // Trova la feature da aggiornare
    const feature = geojson.features.find(f => f.properties['@id'] === idToUpdate);
    
    if (!feature) {
      return res.status(404).json({ 
        error: 'Parcheggio non trovato' 
      });
    }

    // Aggiorna solo le proprietà consentite (whitelist approach)
    const allowedProperties = ['name', 'access', 'fee', 'surface'];
    
    allowedProperties.forEach(prop => {
      if (updatedProps[prop] !== undefined) {
        feature.properties[prop] = updatedProps[prop];
      }
    });

    console.log('Aggiornando parcheggio con ID:', idToUpdate);

    // Salva le modifiche
    writeGeoJSONFile(geojson, (writeErr) => {
      if (writeErr) {
        console.error('Errore nella scrittura del file GeoJSON:', writeErr);
        return res.status(500).json({ 
          error: 'Errore nel salvare le modifiche' 
        });
      }

      res.json({ 
        message: 'Parcheggio aggiornato con successo',
        id: idToUpdate
      });
    });
  });
});

/**
 * DELETE /api/parcheggi/:id
 * Rimuove un parcheggio dal file GeoJSON
 */
app.delete('/api/parcheggi/:id', (req, res) => {
  const idToDelete = req.params.id;

  // Legge il file GeoJSON
  readGeoJSONFile((err, geojson) => {
    if (err) {
      console.error('Errore nella lettura del file GeoJSON:', err);
      return res.status(500).json({ 
        error: 'Errore nel leggere i dati' 
      });
    }

    // Conta le feature prima della rimozione
    const featuresBefore = geojson.features.length;
    
    // Filtra rimuovendo la feature con l'ID specificato
    geojson.features = geojson.features.filter(f => f.properties['@id'] !== idToDelete);

    // Controlla se è stata effettivamente rimossa una feature
    if (geojson.features.length === featuresBefore) {
      return res.status(404).json({ 
        error: 'Parcheggio non trovato' 
      });
    }

    console.log('Rimuovendo parcheggio con ID:', idToDelete);

    // Salva il file aggiornato
    writeGeoJSONFile(geojson, (writeErr) => {
      if (writeErr) {
        console.error('Errore nella scrittura del file GeoJSON:', writeErr);
        return res.status(500).json({ 
          error: 'Errore nel salvare le modifiche' 
        });
      }

      res.json({ 
        message: 'Parcheggio eliminato con successo',
        id: idToDelete
      });
    });
  });
});

// =============================================
// GESTIONE ERRORI GLOBALE
// =============================================

/**
 * Middleware per gestire errori non catturati
 */
app.use((err, req, res, next) => {
  console.error('Errore non gestito:', err);
  res.status(500).json({ 
    error: 'Errore interno del server' 
  });
});

/**
 * Middleware per gestire rotte non trovate
 */
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint non trovato' 
  });
});

// =============================================
// AVVIO SERVER
// =============================================

/**
 * Avvia il server Express
 */
app.listen(PORT, () => {
  console.log(`🚗 Server parcheggi avviato su http://localhost:${PORT}`);
  console.log(`📁 File dati: ${DATA_FILE}`);
  console.log('📡 API disponibili:');
  console.log('   GET    /api/parcheggi     - Lista tutti i parcheggi');
  console.log('   POST   /api/parcheggi     - Aggiunge un nuovo parcheggio');
  console.log('   PUT    /api/parcheggi/:id - Aggiorna un parcheggio');
  console.log('   DELETE /api/parcheggi/:id - Elimina un parcheggio');
});

// =============================================
// GESTIONE CHIUSURA APPLICAZIONE
// =============================================

/**
 * Gestisce la chiusura pulita dell'applicazione
 */
process.on('SIGINT', () => {
  console.log('\n🛑 Chiusura server in corso...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Server terminato');
  process.exit(0);
});