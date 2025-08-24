const express = require('express');
const fs = require('fs');
const path = require('path');

// =============================================
// Configurazione server
// =============================================

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'parcheggi.geojson');

// =============================================
// Middleware
// =============================================

// Serve i file statici dalla cartella 'public'
app.use(express.static('public'));

// Middleware per parsare il JSON nel body delle richieste
app.use(express.json());

// =============================================
// Funzioni di utilità
// =============================================

/**
 * Legge il file GeoJSON e restituisce i dati parsati
 * @param {Function} callback - Callback con (err, geojson)
 */
function readGeoJSONFile(callback) 
{
  fs.readFile(DATA_FILE, 'utf8', (err, data) => 
  {
    if (err) 
    {
      return callback(err, null);
    }

    try 
    {
      const geojson = JSON.parse(data);
      callback(null, geojson);
    } 
    catch (parseError) 
    {
      callback(parseError, null);
    }
  });
}

/**
 * Scrive i dati GeoJSON nel file
 * @param {Object} geojson - Oggetto GeoJSON da salvare
 * @param {Function} callback - Callback con (err)
 */
function writeGeoJSONFile(geojson, callback) 
{
  const jsonString = JSON.stringify(geojson, null, 2);
  fs.writeFile(DATA_FILE, jsonString, callback);
}

/**
 * Genera un ID univoco basato sulle coordinate
 * @param {Array} coordinates - Array [longitude, latitude]
 * @returns {string} ID univoco nel formato "lon_lat"
 */
function generateParkingId(coordinates) 
{
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
function validateParkingFeature(feature) 
{
  if (!feature.geometry || !feature.geometry.coordinates) 
  {
    return { 
      isValid: false, 
      error: 'Feature con coordinate mancanti' 
    };
  }

  const coords = feature.geometry.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) 
  {
    return { 
      isValid: false, 
      error: 'Coordinate non valide' 
    };
  }

  const [lng, lat] = coords;
  if (typeof lng !== 'number' || typeof lat !== 'number') 
  {
    return {
      isValid: false,
      error: 'Le coordinate devono essere numeri'
    };
  }

  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) 
  {
    return {
      isValid: false,
      error: 'Coordinate fuori range valido'
    };
  }

  return { isValid: true };
}

/** Crea un errore con messaggio e status
 * @param {string} message - Messaggio di errore
 * @param {number} [status=500] - Codice di stato HTTP
 * @returns {Error} Errore con messaggio e status
 */
function createError(message, status = 500) 
{
  const err = new Error(message);
  err.status = status;
  err.statusCode = status;
  return err;
}

// =============================================
// Endpoints API per la gestione dei parcheggi
// =============================================

// Restituisce tutti i parcheggi con filtri opzionali
app.get('/api/parcheggi', (req, res, next) => 
{
    readGeoJSONFile((err, geojson) => 
    {
        if (err) 
        {
            return next(createError('Errore caricamento dati', 500));
        }

        if (!geojson || !Array.isArray(geojson.features)) 
        {
            return next(createError('Formato GeoJSON non valido', 500));
        }

        const filters = req.query;
        const allProperties = geojson.features.flatMap(f => Object.keys(f.properties || {}));
        const uniquePropertyKeys = [...new Set(allProperties)];

        // Valida i filtri forniti
        const unknownKeys = Object.keys(filters).filter(key => !uniquePropertyKeys.includes(key));

        if (unknownKeys.length > 0) 
        {
            return next(createError(`Filtri non validi: ${unknownKeys.join(', ')}`, 400));
        }

        // Applica i filtri
        const filtered = geojson.features.filter(feature => 
        {
            return Object.entries(filters).every(([key, val]) => 
            {
                const props = feature.properties || {};
                return (Object.prototype.hasOwnProperty.call(props, key) && 
                       String(props[key]).toLowerCase().trim() === String(val).toLowerCase().trim());
            });
        });

        if (filtered.length === 0) 
        {
            return res.status(200).json(
            {
                message: 'Nessun parcheggio trovato con i filtri forniti',
                features: []
            });
        }

        res.status(200).json({ type: geojson.type, features: filtered });
    });
});

// Aggiunge un nuovo parcheggio
app.post('/api/parcheggi', (req, res, next) => 
{
    // Valida corpo della richiesta
    if (!req.body || typeof req.body !== 'object') 
    {
        return next(createError('Corpo della richiesta non valido o mancante', 400));
    }

    const newFeature = req.body;

    // Verifica presenza geometria
    if (!newFeature.geometry || !newFeature.geometry.coordinates) 
    {
        return next(createError('Geometria mancante nella feature', 400));
    }

    if (!newFeature.properties) 
    {
        newFeature.properties = {};
    }

    const validation = validateParkingFeature(newFeature);
    if (!validation.isValid) 
    {
        return next(createError(validation.error, 400));
    }

    // Genera ID univoco per il parcheggio
    const parkingId = generateParkingId(newFeature.geometry.coordinates);
    newFeature.properties['@id'] = parkingId;

    readGeoJSONFile((err, geojson) => 
    {
        if (err) 
        {
            console.error('Errore nella lettura del file GeoJSON:', err);
            return next(createError('Errore nel leggere i dati esistenti', 500));
        }
        
        if (!Array.isArray(geojson.features)) 
        {
            return next(createError('Il file GeoJSON non contiene un array di feature valido', 500));
        }

        // Verifica duplicati
        const existingFeature = geojson.features.find(f => 
            f.properties && f.properties['@id'] === parkingId
        );
        
        if (existingFeature) 
        {
            return next(createError('Parcheggio già esistente in questa posizione', 409));
        }

        console.log('Aggiungendo parcheggio con ID:', parkingId);
        geojson.features.push(newFeature);

        writeGeoJSONFile(geojson, (writeErr) => 
        {
            if (writeErr) 
            {
                console.error('Errore nella scrittura del file GeoJSON:', writeErr);
                return next(createError('Errore nel salvare il nuovo parcheggio', 500));
            }

            res.status(201).json(
            { 
                message: 'Parcheggio aggiunto con successo', 
                id: parkingId 
            });
        });
    });
});

// Aggiorna un parcheggio esistente
app.put('/api/parcheggi/:id', (req, res, next) => 
{
    const idToUpdate = req.params.id;
    const updatedProps = req.body;
    
    if (!updatedProps || typeof updatedProps !== 'object') 
    {
        return next(createError('Corpo della richiesta non valido o mancante', 400));
    }

    // Proprietà modificabili
    const allowedProperties = ['name', 'access', 'fee', 'surface'];
    const keysToUpdate = allowedProperties.filter(prop => prop in updatedProps);

    if (keysToUpdate.length === 0) 
    {
        return next(createError('Nessuna proprietà aggiornabile valida fornita', 400));
    }

    readGeoJSONFile((err, geojson) => 
    {
        if (err) 
        {
            console.error('Errore nella lettura del file GeoJSON:', err);
            return next(createError('Errore nel leggere i dati', 500));
        }

        if (!geojson || !Array.isArray(geojson.features)) 
        {
            return next(createError('Formato GeoJSON non valido', 500));
        }

        // Trova il parcheggio da aggiornare
        const feature = geojson.features.find(f => f.properties['@id'] === idToUpdate);
        
        if (!feature) 
        {
            return next(createError('Parcheggio non trovato', 404));
        }

        // Aggiorna le proprietà
        keysToUpdate.forEach(prop => 
        {
            feature.properties[prop] = updatedProps[prop];
        });

        console.log('Aggiornando parcheggio con ID:', idToUpdate);

        writeGeoJSONFile(geojson, (writeErr) => 
        {
            if (writeErr) 
            {
                console.error('Errore nella scrittura del file GeoJSON:', writeErr);
                return next(createError('Errore nel salvare le modifiche', 500));
            }

            res.status(200).json(
            {
                message: 'Parcheggio aggiornato con successo',
                id: idToUpdate,
                updatedProperties: keysToUpdate.reduce((obj, key) => 
                {
                    obj[key] = feature.properties[key];
                    return obj;
                }, {})
            });
        });
    });
});

// Elimina un parcheggio
app.delete('/api/parcheggi/:id', (req, res, next) => 
{
    const idToDelete = req.params.id;

    readGeoJSONFile((err, geojson) => 
    {
        if (err) 
        {
            console.error('Errore nella lettura del file GeoJSON:', err);
            return next(createError('Errore nel leggere i dati', 500));
        }

        if (!geojson || !Array.isArray(geojson.features)) 
        {
            return next(createError('Formato GeoJSON non valido', 500));
        }

        const featuresBefore = geojson.features.length;
        
        // Rimuove il parcheggio
        geojson.features = geojson.features.filter(f => f.properties['@id'] !== idToDelete);

        // Verifica se qualcosa è stato rimosso
        if (geojson.features.length === featuresBefore) 
        {
            return next(createError('Parcheggio non trovato', 404));
        }

        console.log('Rimuovendo parcheggio con ID:', idToDelete);

        writeGeoJSONFile(geojson, (writeErr) => 
        {
            if (writeErr) 
            {
                console.error('Errore nella scrittura del file GeoJSON:', writeErr);
                return next(createError('Errore nel salvare le modifiche', 500));
            }

            res.status(200).json(
            { 
                message: 'Parcheggio eliminato con successo',
                id: idToDelete
            });
        });
    });
});

// Gestione errori globale
app.use((err, req, res, next) => 
{
    console.error(`[${new Date().toISOString()}] ERRORE: ${err.message}`);
    const response = {error: err.message || 'Errore interno del server'};
    res.status(err.status || 500).json(response);
});

// Gestione rotte non trovate
app.use((req, res) => 
{
    res.status(404).json(
    {
        error: 'Endpoint non trovato',
        path: req.originalUrl,
        suggestion: 'Verifica l\'URL o consulta la documentazione dell\'API.'
    });
});

// =============================================
// GESTIONE ERRORI GLOBALE
// =============================================

/**
 * Middleware per gestire errori non catturati
 */
app.use((err, req, res, next) => 
{
  console.error(`[${new Date().toISOString()}] ERRORE: ${err.message}`);
  const response = {error: err.message || 'Errore interno del server',};
  res.status(err.status || 500).json(response);
});

/**
 * Middleware per gestire rotte non trovate
 */
app.use((req, res) => 
{
  res.status(404).json(
  {
    error: 'Endpoint non trovato',
    path: req.originalUrl,
    suggestion: 'Verifica l\'URL o consulta la documentazione dell\'API.'
  });
});

// =============================================
// Gestione avvio server
// =============================================

/**
 * Avvia il server Express
 */
app.listen(PORT, () => {
  console.log(`\nServer parcheggi avviato su http://localhost:${PORT}\n`);
  console.log(`\nFile dati: ${DATA_FILE}\n`);
  console.log('\nAPI disponibili:');
  console.log('   GET    /api/parcheggi     - Lista tutti i parcheggi o filtra con query (es. ?fee=yes&access=yes)');
  console.log('   POST   /api/parcheggi     - Aggiunge un nuovo parcheggio');
  console.log('   PUT    /api/parcheggi/:id - Aggiorna un parcheggio');
  console.log('   DELETE /api/parcheggi/:id - Elimina un parcheggio');
});

// =============================================
// Gestione chiusura applicazione
// =============================================

/**
 * Gestisce la chiusura pulita dell'applicazione
 */
function shutdown(signal) 
{
  console.log(`\n🛑 Segnale ricevuto: ${signal} - chiusura server`);
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
