
# 🅿️ FindSPOT - Web App per la Visualizzazione dei Parcheggi

**FindSPOT** è una web app interattiva che consente di visualizzare i parcheggi delle marche su una mappa, filtrare i risultati in base a criteri personalizzati e interagire con i dati GeoJSON tramite un'interfaccia intuitiva.

## 🚀 Funzionalità

- 📍 Visualizzazione dei parcheggi su mappa interattiva (Leaflet)
- 🔍 Filtri di ricerca per città, accesso e tipo di parcheggio
- 🗺️ Colori dinamici dei poligoni in base alle proprietà del parcheggio
- 🧹 Modalità "delete" per rimuovere parcheggi direttamente dalla mappa
- 🌐 Web service RESTful con endpoint `/api/parcheggi` per il caricamento dati

## 🧑‍💻 Tecnologie Utilizzate

- **Frontend:** HTML, CSS, JavaScript, Leaflet.js
- **Backend:** Node.js, Express.js
- **Dati:** GeoJSON (open data dei parcheggi)

## 📦 Struttura del Progetto

```

/data
└─ parcheggi.geojson

/public
├─ index.html
├─ add.html
├─ edit.html
├─ remove.html
├─ map.html
├─ /css
    ├─ style.css 
    ├─ add.css 
    ├─ edit.css 
    ├─ remove.css 
    ├─ map.css 
└─ /js          
    ├─ map.js 
    ├─ filter.js 
    ├─ search.js 
    ├─ add.js 
└─ /img

package.json
server.js

```

## ⚙️ Setup Locale

1. Clona il repository:

```bash
git clone https://github.com/MattiaGasperoni/Progetto-Tecnologie-WEB.git
cd Progetto-Tecnologie-WEB
````

2. Installa le dipendenze:

```bash
npm install
```

3. Avvia il server:

```bash
npm start
```

4. Visita `http://localhost:3000` nel browser.

## 🌐 API

* `GET /api/parcheggi`
  Restituisce la lista dei parcheggi in formato GeoJSON

## 👤 Autore

**Mattia Gasperoni**
Studente di Informatica @UniUrb

**Andrea Rossi**
Studente di Informatica @UniUrb

---


