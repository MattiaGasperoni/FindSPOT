# FindSPOT

A geospatial web application for locating and exploring parking spots using **GeoJSON** datasets and a **Node.js / Express** backend.

## Overview

**FindSPOT** ingests structured parking geospatial data (`parcheggi.geojson`) and serves an interactive web interface to help users discover available parking areas efficiently. The repository includes the web application source code, dataset analysis utilities, and technical project documentation.

## Repository Structure

| Path | Description |
| :--- | :--- |
| `src/` | Core Node.js/Express application source code and runtime assets. |
| `src/data/parcheggi.geojson` | GeoJSON dataset containing parking spot coordinates and metadata. |
| `src/analyzeGeoJson.py` | Python utility script for inspecting, validating, and summarizing GeoJSON properties. |
| `Relazione_WEB.pdf` | Full technical report detailing system architecture, design choices, and implementation notes. |

## Prerequisites

* **Node.js** (v18+ recommended) and **npm**
* **Python 3.8+** (optional, required only to run `analyzeGeoJson.py`)

## Getting Started

### 1. Install Dependencies

Navigate to the `src/` directory and install the required Node.js packages:

```bash
cd src
npm install
```

### 2. Run the Application

Start the Express server from `src/`

```bash
npm start
```

### 3. Inspect the GeoJSON Dataset (Optional)

To analyze schema fields and feature counts in `parcheggi.geojson`:

```bash
cd src
python3 analyzeGeoJson.py
```
