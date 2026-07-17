let IMAGE_ATTRIBS = new Map();

function normalizePath(path) {
  return path.replace(/\\/g, '/');
}

function parseCsv(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  let row = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (current !== '' || row.length > 0) {
        row.push(current);
        rows.push(row);
        row = [];
        current = '';
      }
      if (char === '\r' && next === '\n') {
        i++;
      }
      continue;
    }

    current += char;
  }

  if (current !== '' || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows;
}

async function loadImageAttribs() {
  try {
    const response = await fetch('assets/image_attribs.csv');
    if (!response.ok) return;
    const text = await response.text();
    const rows = parseCsv(text);
    const headers = rows.shift().map(cell => cell.trim());

    rows.forEach(columns => {
      if (columns.length < headers.length) return;
      const entry = headers.reduce((acc, key, index) => {
        acc[key] = columns[index] || '';
        return acc;
      }, {});

      const trail = entry.Trail?.trim();
      const waypoint = entry.Waypoint?.trim();
      if (!trail || !waypoint) return;

      const key = `${trail}:${waypoint}`;
      const items = IMAGE_ATTRIBS.get(key) || [];
      const fileField = normalizePath((entry.File || '').trim());
      const source = fileField && /\.[a-z0-9]+$/i.test(fileField)
        ? fileField
        : (entry.url || '').trim();
      items.push({
        src: source,
        caption: entry.Caption || '',
        attribution: entry.Attribution || '',
        url: (entry.url || '').trim()
      });
      IMAGE_ATTRIBS.set(key, items);
    });
  } catch (error) {
    console.warn('Unable to load image attributes CSV', error);
  }
}

function getWaypointImages(trail, waypoint) {
  const key = `${trail}:${waypoint}`;
  return IMAGE_ATTRIBS.get(key) || [];
}
