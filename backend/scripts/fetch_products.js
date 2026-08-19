const https = require('https');

https.get('https://margele-net-project.onrender.com/products', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const products = JSON.parse(data);
      console.log('Backend returned', products.length, 'products:');
      products.forEach(p => {
        console.log(`- ID: ${p.id}, Name: "${p.name}", SKU: "${p.sku}"`);
      });
    } catch (e) {
      console.log('Failed to parse response:', e.message);
      console.log('Response content:', data);
    }
  });
}).on('error', (err) => {
  console.error('Error connecting to backend:', err.message);
});
