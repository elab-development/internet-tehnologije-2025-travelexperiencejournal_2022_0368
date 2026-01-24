import dotenv from 'dotenv';
import path from 'path';

// Učitaj .env.local za ostale varijable
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Učitaj service account JSON
const serviceAccount = require('./serviceAccount.json');

// Inicijalizuj Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();
const auth = getAuth();

async function seed() {
  console.log('🌱 Započinjem seed...');

  try {
    // 1. Kreiraj test korisnike
    console.log('👤 Kreiram korisnike...');

    const users = [
      {
        email: 'admin@test.com',
        password: 'admin123',
        displayName: 'Admin User',
        role: 'admin',
      },
      {
        email: 'editor@test.com',
        password: 'editor123',
        displayName: 'Editor User',
        role: 'editor',
      },
      {
        email: 'user@test.com',
        password: 'user123',
        displayName: 'Regular User',
        role: 'user',
      },
    ];

    const createdUsers = [];

    for (const userData of users) {
      try {
        // Proveri da li korisnik već postoji
        let userRecord;
        try {
          userRecord = await auth.getUserByEmail(userData.email);
          console.log(`  ✓ Korisnik ${userData.email} već postoji`);
        } catch {
          // Kreiraj novog korisnika
          userRecord = await auth.createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.displayName,
          });
          console.log(`  ✓ Kreiran korisnik: ${userData.email}`);
        }

        // Sačuvaj u Firestore
        await db.collection('users').doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: userData.email,
          displayName: userData.displayName,
          bio: `Ovo je ${userData.role} korisnik.`,
          profilePhotoURL: '',
          role: userData.role,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        createdUsers.push({ uid: userRecord.uid, ...userData });
      } catch (error: any) {
        console.error(`  ✗ Greška za ${userData.email}:`, error.message);
      }
    }

    // 2. Kreiraj destinacije
    console.log('🗺  Kreiram destinacije...');

    const destinations = [
      {
        name: 'Pariz',
        country: 'Francuska',
        description: 'Grad svetlosti sa Ajfelovom kulom i Luvrom.',
      },
      {
        name: 'Tokio',
        country: 'Japan',
        description: 'Moderan grad sa bogatom kulturom i tehnologijom.',
      },
      {
        name: 'Beograd',
        country: 'Srbija',
        description: 'Glavni grad Srbije sa bogatom istorijom.',
      },
      {
        name: 'Barselona',
        country: 'Španija',
        description: 'Grad Gaudija sa prelepom arhitekturom.',
      },
      {
        name: 'Njujork',
        country: 'SAD',
        description: 'Grad koji nikad ne spava.',
      },
    ];

    const createdDestinations = [];

    for (const dest of destinations) {
      const destRef = db.collection('destinations').doc();
      await destRef.set({
        destinationId: destRef.id,
        ...dest,
        createdBy: createdUsers[0].uid,
        averageRating: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      createdDestinations.push({ id: destRef.id, ...dest });
      console.log(`  ✓ Kreirana destinacija: ${dest.name}`);
    }

    // 3. Kreiraj putopise
    console.log('📝 Kreiram putopise...');

    const posts = [
      {
        title: 'Magični vikend u Parizu',
        content:
          'Pariz je grad koji ostavlja bez daha. Od Ajfelove kule do šetnje pored Seine, svaki trenutak je bio nezaboravan. Preporučujem posetu Luvru rano ujutro da izbegnete gužvu.',
        destinationId: createdDestinations[0].id,
        authorId: createdUsers[2].uid,
        travelDate: new Date('2024-01-15'),
      },
      {
        title: 'Tokio: Gde tradicija susreće budućnost',
        content:
          'Tokio je grad kontrasta. Jedan dan ste u tradicionalnom hramu, a sledeći u futurističkom Akihabara distriktu. Hrana je neverovatna, a ljudi izuzetno ljubazni.',
        destinationId: createdDestinations[1].id,
        authorId: createdUsers[1].uid,
        travelDate: new Date('2024-02-20'),
      },
      {
        title: 'Beograd noću',
        content:
          'Beogradski noćni život je legenda. Splavovi na Savi, Skadarlija, Kalemegdan... Svaki kutak grada ima svoju priču. Obavezno probajte ćevape u Skadarliji!',
        destinationId: createdDestinations[2].id,
        authorId: createdUsers[2].uid,
        travelDate: new Date('2024-03-10'),
      },
      {
        title: 'Gaudi i Barselona',
        content:
          'Sagrada Familia je remek-delo koje ne može da se opiše rečima. Park Güell je kao iz bajke. Barselona je grad koji morate posetiti bar jednom u životu.',
        destinationId: createdDestinations[3].id,
        authorId: createdUsers[0].uid,
        travelDate: new Date('2024-04-05'),
      },
    ];

    const createdPosts = [];

    for (const post of posts) {
      const postRef = db.collection('posts').doc();
      await postRef.set({
        postId: postRef.id,
        ...post,
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      createdPosts.push({ id: postRef.id, ...post });
      console.log(`  ✓ Kreiran putopis: ${post.title}`);
    }

    // 4. Kreiraj komentare
    console.log('💬 Kreiram komentare...');

    const comments = [
      {
        postId: createdPosts[0].id,
        authorId: createdUsers[1].uid,
        content: 'Odličan vodič! Planiram da posetim Pariz sledeće godine.',
      },
      {
        postId: createdPosts[0].id,
        authorId: createdUsers[0].uid,
        content: 'Hvala na savetima! Koliko si dana proveo tamo?',
      },
      {
        postId: createdPosts[1].id,
        authorId: createdUsers[2].uid,
        content: 'Tokio je na mojoj bucket listi. Hvala na inspiraciji!',
      },
    ];

    for (const comment of comments) {
      const commentRef = db.collection('comments').doc();
      await commentRef.set({
        commentId: commentRef.id,
        ...comment,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`  ✓ Kreiran komentar`);
    }

    // 5. Kreiraj ocene
    console.log('⭐ Kreiram ocene...');

    const ratings = [
      {
        destinationId: createdDestinations[0].id,
        userId: createdUsers[2].uid,
        score: 5,
      },
      {
        destinationId: createdDestinations[1].id,
        userId: createdUsers[1].uid,
        score: 5,
      },
      {
        destinationId: createdDestinations[2].id,
        userId: createdUsers[2].uid,
        score: 4,
      },
    ];

    for (const rating of ratings) {
      const ratingRef = db.collection('ratings').doc();
      await ratingRef.set({
        ratingId: ratingRef.id,
        ...rating,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`  ✓ Kreirana ocena`);
    }

    console.log('\n✅ Seed uspešno završen!');
    console.log('\n📊 Kreirano:');
    console.log(`  - ${createdUsers.length} korisnika`);
    console.log(`  - ${createdDestinations.length} destinacija`);
    console.log(`  - ${createdPosts.length} putopisa`);
    console.log(`  - ${comments.length} komentara`);
    console.log(`  - ${ratings.length} ocena`);
    console.log('\n🔑 Test kredencijali:');
    console.log('  Admin: admin@test.com / admin123');
    console.log('  Editor: editor@test.com / editor123');
    console.log('  User: user@test.com / user123');
  } catch (error) {
    console.error('❌ Greška pri seed-u:', error);
  }
}

seed();