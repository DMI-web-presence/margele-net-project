const https = require('https');
const fs = require('fs');
const path = require('path');

const SOURCE_URL = 'https://raw.githubusercontent.com/virgil-av/judet-oras-localitati-romania/master/judete.json';
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'localitati.json');

console.log('Downloading Romanian localities from:', SOURCE_URL);

https.get(SOURCE_URL, (res) => {
  if (res.statusCode !== 200) {
    console.error('Failed to download dataset. HTTP Status:', res.statusCode);
    process.exit(1);
  }

  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    try {
      console.log('Download complete. Parsing JSON...');
      const data = JSON.parse(body);

      if (!data || !Array.isArray(data.judete)) {
        console.error('Dataset is not in the expected format (missing judete array).');
        process.exit(1);
      }

      console.log(`Loaded ${data.judete.length} counties. Processing and flatting localities...`);

      const list = [];
      data.judete.forEach((judet) => {
        const countyName = judet.nume.trim();
        if (Array.isArray(judet.localitati)) {
          judet.localitati.forEach((loc) => {
            if (loc && loc.nume) {
              list.push({
                n: loc.nume.trim(),
                j: countyName
              });
            }
          });
        }
      });

      console.log(`Found ${list.length} total localities. Sorting...`);

      // Sort alphabetically by name
      list.sort((a, b) => a.n.localeCompare(b.n, 'ro'));

      // Ensure public directory exists
      const publicDir = path.dirname(OUTPUT_FILE);
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      // Write to public/localitati.json
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(list), 'utf8');
      
      const stats = fs.statSync(OUTPUT_FILE);
      const sizeKB = (stats.size / 1024).toFixed(2);
      
      console.log(`Successfully wrote ${list.length} entries to ${OUTPUT_FILE} (${sizeKB} KB).`);
    } catch (err) {
      console.error('Error processing JSON data:', err.message);
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error('Request error:', err.message);
  process.exit(1);
});
