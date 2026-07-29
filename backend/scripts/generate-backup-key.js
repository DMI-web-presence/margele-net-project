const crypto = require('crypto');

console.log('Add this to backend/.env and store it safely outside the server too:');
console.log('');
console.log(`BACKUP_ENCRYPTION_KEY=${crypto.randomBytes(48).toString('base64url')}`);
