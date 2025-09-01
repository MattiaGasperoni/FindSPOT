# 🅿️ FindSPOT – Find Your Next Parking Spot Easily

**FindSPOT** is an interactive web app that allows users to view parking areas in the Marche region on a map, filter results based on custom criteria, and interact with GeoJSON data through an intuitive interface.

## 🚀 Features

- 📍 Display of parking areas on an interactive map
- 🔍 Search filters by city, access type, and parking type
- 🧹 “Delete” mode to remove parking spots directly from the map
- ➕ Add new parking spots with automatic validation
- ✏️ Edit properties of existing parking spots

## 🧑‍💻 Technologies Used

- **Frontend:** HTML, CSS, JavaScript, Leaflet.js  
- **Backend:** Node.js, Express.js  
- **Data:** GeoJSON (open parking data)

## 📦 Project Structure



```
server.js

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
    ├─ add.js 
    ├─ edit.js 
    ├─ errorHandler.js
    ├─ filter.js
    ├─ map.js
    ├─ remove.js
    ├─ search.js 
└─ /img
    ├─ background.jpg
    ├─ background_add.jpg
    ├─ background_gray.png

analyzeGeoJson.py

/node_modules

package.json

package-lock.json

README.md
```

## ⚙️ Local Setup

1. Clone the repository:
```bash
git clone https://github.com/MattiaGasperoni/FindSPOT.git
cd FindSPOT/src


2. Install the dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open `http://localhost:3000` in your browser.

## 🌐 API Endpoints

The project exposes a full RESTful API for managing parking data.

For complete API documentation, including usage examples and technical details, please refer to the [project report (PDF)](./Relazione_WEB.pdf).

## 👤 Authors

**Mattia Gasperoni**  
Computer Science Student @UniUrb

**Andrea Rossi**  
Computer Science Student @UniUrb

---
