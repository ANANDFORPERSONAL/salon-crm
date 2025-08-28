const bcrypt = require('bcryptjs');

async function generateHashes() {
  const passwords = ['admin123', 'manager123', 'staff123'];
  
  for (const password of passwords) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`${password}: ${hash}`);
  }
}

generateHashes(); 