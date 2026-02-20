import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = require('./serviceAccount.json');

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function geocode(name: string, country: string) {
  const query = encodeURIComponent(`${name}, ${country}`);
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
    { headers: { 'User-Agent': 'TravelJournal/1.0' } }
  );
  const data = await res.json();
  if (data.length === 0) return null;
  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
  };
}

async function migrate() {
  console.log('🗺  Geocoding destinacija...\n');

  const snapshot = await db.collection('destinations').get();

  for (const doc of snapshot.docs) {
    const data = doc.data();

    if (data.latitude && data.longitude) {
      console.log(`  ✓ ${data.name} — već ima koordinate`);
      continue;
    }

    // Nominatim rate limit: 1 req/sec
    await new Promise((r) => setTimeout(r, 1100));

    const coords = await geocode(data.name, data.country);

    if (coords) {
      await db.collection('destinations').doc(doc.id).update({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      console.log(`  ✓ ${data.name} → ${coords.latitude}, ${coords.longitude}`);
    } else {
      console.log(`  ✗ ${data.name} — nije pronađeno`);
    }
  }

  console.log('\n✅ Geocoding završen!');
}

migrate();
