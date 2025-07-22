import json
from collections import Counter
from pathlib import Path

# Campi da analizzare
FIELDS = ["surface", "access", "fee", "capacity", "maxstay", "operator", "supervised"]

def analyze_selected_fields(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    features = data.get("features", [])
    print(f"Numero totale di feature: {len(features)}\n")

    field_counters = {field: Counter() for field in FIELDS}

    for feature in features:
        props = feature.get("properties", {})
        for field in FIELDS:
            value = props.get(field)
            if value is not None:
                # Rende tutto una stringa
                field_counters[field][str(value)] += 1

    print("ANALISI DEI CAMPI :\n" + "=" * 50)
    for field in FIELDS:
        print(f"Campo: {field}")
        if field_counters[field]:
            for value, count in field_counters[field].most_common():
                print(f"   • {value}: {count} occorrenze")
        else:
            print("   (Nessun dato disponibile)")
        print("-" * 50)

# ESEMPIO USO
if __name__ == "__main__":
    geojson_file = Path("data/parcheggi.geojson") 
    analyze_selected_fields(geojson_file)
