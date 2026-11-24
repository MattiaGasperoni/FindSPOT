# FindSPOT: Geospatial Parking Locator Web Application

A full-stack geospatial web application designed to help users discover, inspect, and filter available parking spots using structured **GeoJSON** datasets. Built with a **Node.js / Express** backend, interactive web frontend, and **Python** spatial data preprocessing utilities.

---

## Table of Contents
- [Overview](#overview)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Running](#installation--running)
  - [Data Analysis Utility](#data-analysis-utility)
- [Documentation](#documentation)

---

## Overview

**FindSPOT** bridges open geospatial data with a responsive web interface to streamline urban parking discovery. Starting from raw spatial datasets (`parcheggi.geojson`), the system parses geographic coordinates, capacity metadata, and parking attributes to serve real-time queries through a RESTful Express server.

---

## Architecture & Tech Stack

* **Backend**: Node.js with Express.js (`express`, `body-parser`) serving static assets and geospatial API endpoints.
* **Geospatial Data Layer**: RFC 7946 compliant GeoJSON (`src/data/parcheggi.geojson`) storing point/polygon geometries and parking facility properties.
* **Data Preprocessing & Inspection**: Python script (`src/analyzeGeoJson.py`) for schema validation, feature extraction, and dataset statistics.
* **Frontend**: Interactive web client for map visualization and location-based filtering.

---

## Features

* **Interactive Spatial Visualization**: Displays parking facilities and geographic coordinates directly on an interactive map view.
* **GeoJSON Data Pipeline**: Ingests and serves structured municipal/open parking datasets (`parcheggi.geojson`).
* **Attribute Filtering & Search**: Enables users to query parking spots based on location proximity, capacity, and facility metadata.
* **Dataset Inspection Tooling**: Includes standalone Python tooling to audit GeoJSON feature collections and verify data integrity prior to deployment.

---

## Project Structure

```text
findspot/
├── src/
│   ├── data/
│   │   └── parcheggi.geojson     # Geospatial dataset of parking locations
│   ├── analyzeGeoJson.py         # Python utility for GeoJSON inspection & stats
│   └── ...                       # Express server, routes, and frontend web assets
├── Relazione_WEB.pdf             # Technical report and architectural documentation
└── README.md                     # Project documentation
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended) and `npm`
- [Python](https://www.python.org/) 3.x (optional, for running the GeoJSON analysis script)

### Installation & Running

1. Clone the repository:
   ```bash
   git clone https://github.com/mattiagasperoni/findspot.git
   cd findspot/src
   ```

2. Install dependencies (if not already present):
   ```bash
   npm install
   ```

3. Start the Express server:
   ```bash
   node index.js
   ```

4. Open your browser and navigate to `http://localhost:3000` (or the configured server port).

### Data Analysis Utility

To inspect the structure and summary statistics of the parking GeoJSON dataset:
```bash
cd src
python3 analyzeGeoJson.py
```

---

## Documentation

For UI wireframes, system architecture diagrams, API design, and implementation details, refer to [`Relazione_WEB.pdf`](Relazione_WEB.pdf).
