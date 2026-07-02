#!/usr/bin/env python3
"""
consolidate_mbs.py — Procesa exports crudos de Meta Business Suite
Genera 3 CSVs limpios en panel-social/public/data/

Formato de inputs:
  - Métricas (Alcance/Visitas/etc): UTF-16 LE, 1 métrica/archivo, 2 cols (Fecha, Primary)
  - Contenido: UTF-8 BOM, 2 variantes (Posts/Reels y Historias)
  - Público: UTF-16 LE, multi-sección (edad+género, países, ciudades)
"""

import os, csv, codecs, io, sys

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(_SCRIPT_DIR, '..', '..', 'csv-exports', 'insta-lentesplus.latam'))
OUT  = os.path.normpath(os.path.join(_SCRIPT_DIR, '..', 'public', 'data'))
os.makedirs(OUT, exist_ok=True)

# ─── Helpers ─────────────────────────────────────────────────────

def csv_line(line):
    """Parse a single CSV line respecting quotes."""
    reader = csv.reader(io.StringIO(line.strip()))
    return next(reader, [])

def read_utf16_metric(filepath):
    """Lee un CSV de métrica MBS (UTF-16) y retorna {fecha_str: valor}."""
    data = {}
    try:
        with codecs.open(filepath, 'r', 'utf-16') as f:
            lines = f.readlines()
        # Estructura: sep=, / "Nombre métrica" / "Fecha","Primary" / datos...
        for line in lines[3:]:
            line = line.strip()
            if not line:
                continue
            fields = csv_line(line)
            if len(fields) >= 2:
                fecha = fields[0][:10]   # "2025-01-01T00:00:00" → "2025-01-01"
                valor = fields[1]
                if fecha and valor:
                    data[fecha] = valor
    except Exception as e:
        print(f"  ⚠️  {os.path.basename(filepath)}: {e}", file=sys.stderr)
    return data

METRIC_MAP = {
    'Alcance':            'Alcance.csv',
    'Clics':              'Clics en el enlace.csv',
    'Interacciones':      'Interacciones.csv',
    'Seguidores':         'Seguidores.csv',
    'Visitas':            'Visitas.csv',
    'Visualizaciones':    'Visualizaciones.csv',
}

# ─── 1. RESULTADOS ────────────────────────────────────────────────
print("\n📊 Consolidando RESULTADOS...")

all_dates = {}
for period in sorted(os.listdir(ROOT)):
    pd = os.path.join(ROOT, period)
    if not os.path.isdir(pd) or period.startswith('publico'):
        continue
    print(f"  → {period}")
    for col_name, filename in METRIC_MAP.items():
        fp = os.path.join(pd, filename)
        if not os.path.exists(fp):
            continue
        data = read_utf16_metric(fp)
        for fecha, valor in data.items():
            if fecha not in all_dates:
                all_dates[fecha] = {}
            all_dates[fecha][col_name] = valor

RESULT_COLS = ['Fecha','Alcance','Clics','Interacciones','Seguidores','Visitas','Visualizaciones']
out_path = os.path.join(OUT, 'resultados.csv')
with open(out_path, 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(RESULT_COLS)
    for fecha in sorted(all_dates.keys()):
        row = all_dates[fecha]
        w.writerow([fecha] + [row.get(c, '') for c in RESULT_COLS[1:]])

print(f"  ✅ resultados.csv → {len(all_dates)} días ({sorted(all_dates.keys())[0]} a {sorted(all_dates.keys())[-1]})")

# ─── 2. CONTENIDO ─────────────────────────────────────────────────
print("\n📝 Consolidando CONTENIDO...")

# Columnas de salida unificadas (intersección + union útil de ambos formatos)
CONT_COLS = [
    'Identificador de la publicación',
    'Nombre de usuario de la cuenta',
    'Descripción',
    'Hora de publicación',
    'Enlace permanente',
    'Tipo de publicación',
    'Visualizaciones',
    'Alcance',
    'Me gusta',
    'Veces que se compartió',
    'Comentarios',
    'Veces que se guardó',
    'Seguimientos',
]

def get_field(row, *candidates):
    """Busca un campo en el dict de la fila usando múltiples variantes."""
    for c in candidates:
        if c in row:
            return row[c]
        for k in row:
            if c.lower() in k.lower():
                return row[k]
    return ''

seen_ids = set()
cont_rows = []

for period in sorted(os.listdir(ROOT)):
    pd = os.path.join(ROOT, period)
    if not os.path.isdir(pd) or period.startswith('publico'):
        continue
    for filename in sorted(os.listdir(pd)):
        # Los archivos de contenido tienen nombres con números (IDs de cuenta)
        if not filename.endswith('.csv'):
            continue
        # Excluir los archivos de métricas por nombre
        if any(m in filename for m in ['Alcance','Visitas','Visualizaciones','Interacciones','Seguidores','Clics']):
            continue
        # Solo incluir archivos de contenido (nombres con dígitos o patrón fecha_id)
        if not any(c.isdigit() for c in filename.split('_')[0] if filename[0].isalpha() and filename[0] == 'J'):
            # Solo archivos con nombre tipo "Jan-01-2025_Dec-31-2025_XXXXXXXX.csv"
            pass

        fp = os.path.join(pd, filename)
        try:
            with open(fp, encoding='utf-8-sig', newline='') as f:
                reader = csv.DictReader(f)
                count = 0
                for row in reader:
                    pub_id = get_field(row, 'Identificador de la publicación').strip()
                    if not pub_id or pub_id in seen_ids:
                        continue
                    # Saltar filas de metadatos (Fecha="Total" sin ID válido son historias parciales, pero con ID las incluimos)
                    # Para Historias, incluir solo filas con Fecha="Total" (agregado) o Fecha vacía
                    fecha_col = get_field(row, 'Fecha').strip()
                    tipo = get_field(row, 'Tipo de publicación').strip().lower()
                    # Si es historia y fecha no es Total, saltar (son filas por slide)
                    if 'historia' in tipo and fecha_col and fecha_col.lower() not in ('total', ''):
                        continue
                    seen_ids.add(pub_id)
                    out = {
                        'Identificador de la publicación': pub_id,
                        'Nombre de usuario de la cuenta': get_field(row, 'Nombre de usuario de la cuenta', 'usuario'),
                        'Descripción': get_field(row, 'Descripción', 'descripcion'),
                        'Hora de publicación': get_field(row, 'Hora de publicación'),
                        'Enlace permanente': get_field(row, 'Enlace permanente'),
                        'Tipo de publicación': get_field(row, 'Tipo de publicación'),
                        'Visualizaciones': get_field(row, 'Visualizaciones'),
                        'Alcance': get_field(row, 'Alcance'),
                        'Me gusta': get_field(row, 'Me gusta'),
                        'Veces que se compartió': get_field(row, 'Veces que se compartió'),
                        'Comentarios': get_field(row, 'Comentarios'),
                        'Veces que se guardó': get_field(row, 'Veces que se guardó'),
                        'Seguimientos': get_field(row, 'Seguimientos'),
                    }
                    cont_rows.append(out)
                    count += 1
            if count:
                print(f"  → {period}/{filename}: {count} publicaciones")
        except Exception as e:
            print(f"  ⚠️  {filename}: {e}", file=sys.stderr)

out_path = os.path.join(OUT, 'contenido.csv')
with open(out_path, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=CONT_COLS)
    w.writeheader()
    w.writerows(cont_rows)

print(f"  ✅ contenido.csv → {len(cont_rows)} publicaciones únicas")

# ─── 3. PÚBLICO ───────────────────────────────────────────────────
print("\n👥 Consolidando PÚBLICO...")

# Buscar el archivo más reciente de Público
publico_file = None
for period in sorted(os.listdir(ROOT), reverse=True):
    fp = os.path.join(ROOT, period, 'Público.csv')
    if os.path.exists(fp):
        publico_file = fp
        break

if not publico_file:
    print("  ⚠️  No se encontró archivo Público.csv")
else:
    with codecs.open(publico_file, 'r', 'utf-16') as f:
        lines = f.readlines()

    section = None
    edad_rows = []
    paises_names, paises_values = [], []
    ciudades_names, ciudades_values = [], []

    for line in lines:
        line = line.strip()
        if not line or line.startswith('sep='):
            continue
        fields = csv_line(line)
        if not fields:
            continue
        label = fields[0].strip('"') if fields else ''

        if label == 'Edad y sexo':
            section = 'edad'
            continue
        elif label == 'Principales países':
            section = 'paises'
            continue
        elif label == 'Principales ciudades':
            section = 'ciudades'
            continue

        # Skip column header of edad section ("","Mujeres","Hombres")
        if section == 'edad' and label == '':
            continue

        if section == 'edad':
            edad_rows.append([f.strip('"') for f in fields])
        elif section == 'paises':
            if not paises_names:
                paises_names = [f.strip('"') for f in fields]
            else:
                paises_values = [f.strip('"') for f in fields]
        elif section == 'ciudades':
            if not ciudades_names:
                ciudades_names = [f.strip('"') for f in fields]
            else:
                ciudades_values = [f.strip('"') for f in fields]

    # Generar formato wide compatible con parseAudienceSheet()
    max_len = max(len(edad_rows), len(paises_names), len(ciudades_names))
    out_path = os.path.join(OUT, 'publico.csv')
    with open(out_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['Rango de edad', 'Mujeres (%)', 'Hombres (%)', 'Ciudad', 'Porcentaje (%)', 'País', 'Porcentaje (%)'])
        for i in range(max_len):
            edad  = edad_rows[i]       if i < len(edad_rows)      else ['','','']
            while len(edad) < 3: edad.append('')
            ciudad     = ciudades_names[i]  if i < len(ciudades_names)  else ''
            ciudad_pct = ciudades_values[i] if i < len(ciudades_values) else ''
            pais       = paises_names[i]    if i < len(paises_names)    else ''
            pais_pct   = paises_values[i]   if i < len(paises_values)   else ''
            w.writerow([edad[0], edad[1], edad[2], ciudad, ciudad_pct, pais, pais_pct])

    print(f"  ✅ publico.csv → {len(edad_rows)} rangos edad, {len(ciudades_names)} ciudades, {len(paises_names)} países")

print("\n🎉 Consolidación completa.")
