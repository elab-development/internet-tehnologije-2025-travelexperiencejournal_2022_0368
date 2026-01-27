import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('🔍 Firebase Config:');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Auth Domain:', firebaseConfig.authDomain);
console.log('');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seedClient() {
  console.log('🌱 Započinjem seed...\n');

  try {
    // 1. Kreiraj korisnike
    console.log('👤 Kreiram korisnike...');

    const users = [
      { email: 'admin@test.com', password: 'admin123', displayName: 'Admin User', role: 'admin' },
      { email: 'editor@test.com', password: 'editor123', displayName: 'Editor User', role: 'editor' },
      { email: 'user@test.com', password: 'user123', displayName: 'Regular User', role: 'user' },
    ];

    const createdUsers = [];

    for (const userData of users) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          userData.email,
          userData.password
        );
        const uid = userCredential.user.uid;

        // Sačuvaj u Firestore
        await setDoc(doc(db, 'users', uid), {
          uid,
          email: userData.email,
          displayName: userData.displayName,
          bio: `Ovo je ${userData.role} korisnik.`,
          profilePhotoURL: '',
          role: userData.role,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        createdUsers.push({ uid, ...userData });
        console.log(`  ✓ Kreiran korisnik: ${userData.email}`);
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          // Korisnik već postoji - uloguj se da dobiješ UID
          try {
            const cred = await signInWithEmailAndPassword(
              auth,
              userData.email,
              userData.password
            );
            createdUsers.push({ uid: cred.user.uid, ...userData });
            console.log(`  ✓ Korisnik ${userData.email} već postoji`);
          } catch (loginError: any) {
            console.error(`  ✗ Ne mogu da se ulogujem kao ${userData.email}`);
          }
        } else {
          console.error(`  ✗ Greška za ${userData.email}:`, error.message);
        }
      }
    }

    if (createdUsers.length === 0) {
      throw new Error('Nijedan korisnik nije kreiran!');
    }

    console.log(`\n✅ ${createdUsers.length} korisnika spremno\n`);

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
      const destRef = doc(collection(db, 'destinations'));
      await setDoc(destRef, {
        destinationId: destRef.id,
        ...dest,
        createdBy: createdUsers[0].uid,
        averageRating: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      createdDestinations.push({ id: destRef.id, ...dest });
      console.log(`  ✓ Kreirana destinacija: ${dest.name}`);
    }

    console.log(`\n✅ ${createdDestinations.length} destinacija spremno\n`);

    // 3. Kreiraj putopise
    console.log('📝 Kreiram putopise...');

    const posts = [
      {
        title: 'Magični vikend u Parizu',
        content:
          'Pariz je grad koji ostavlja bez daha. Od Ajfelove kule do šetnje pored Seine, svaki trenutak je bio nezaboravan. Preporučujem posetu Luvru rano ujutro da izbegnete gužvu.',
        destinationId: createdDestinations[0].id,
        authorId: createdUsers[2].uid,
        travelDate: Timestamp.fromDate(new Date('2024-01-15')),
      },
      {
        title: 'Tokio: Gde tradicija susreće budućnost',
        content:
          'Tokio je grad kontrasta. Jedan dan ste u tradicionalnom hramu, a sledeći u futurističkom Akihabara distriktu. Hrana je neverovatna, a ljudi izuzetno ljubazni.',
        destinationId: createdDestinations[1].id,
        authorId: createdUsers[1].uid,
        travelDate: Timestamp.fromDate(new Date('2024-02-20')),
      },
      {
        title: 'Beograd noću',
        content:
          'Beogradski noćni život je legenda. Splavovi na Savi, Skadarlija, Kalemegdan... Svaki kutak grada ima svoju priču. Obavezno probajte ćevape u Skadarliji!',
        destinationId: createdDestinations[2].id,
        authorId: createdUsers[2].uid,
        travelDate: Timestamp.fromDate(new Date('2024-03-10')),
      },
      {
        title: 'Gaudi i Barselona',
        content:
          'Sagrada Familia je remek-delo koje ne može da se opiše rečima. Park Güell je kao iz bajke. Barselona je grad koji morate posetiti bar jednom u životu.',
        destinationId: createdDestinations[3].id,
        authorId: createdUsers[0].uid,
        travelDate: Timestamp.fromDate(new Date('2024-04-05')),
      },
    ];

    const createdPosts = [];

    for (const post of posts) {
      const postRef = doc(collection(db, 'posts'));
      await setDoc(postRef, {
        postId: postRef.id,
        ...post,
        isPublished: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      createdPosts.push({ id: postRef.id, ...post });
      console.log(`  ✓ Kreiran putopis: ${post.title}`);
    }

    console.log(`\n✅ ${createdPosts.length} putopisa spremno\n`);

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
      const commentRef = doc(collection(db, 'comments'));
      await setDoc(commentRef, {
        commentId: commentRef.id,
        ...comment,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log(`  ✓ Kreiran komentar`);
    }

    console.log(`\n✅ ${comments.length} komentara spremno\n`);

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
      const ratingRef = doc(collection(db, 'ratings'));
      await setDoc(ratingRef, {
        ratingId: ratingRef.id,
        ...rating,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log(`  ✓ Kreirana ocena`);
    }

    console.log(`\n✅ ${ratings.length} ocena spremno\n`);

    // Finalni rezime
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Seed uspešno završen!\n');
    console.log('📊 Kreirano:');
    console.log(`  - ${createdUsers.length} korisnika`);
    console.log(`  - ${createdDestinations.length} destinacija`);
    console.log(`  - ${createdPosts.length} putopisa`);
    console.log(`  - ${comments.length} komentara`);
    console.log(`  - ${ratings.length} ocena\n`);
    console.log('🔑 Test kredencijali:');
    console.log('  Admin:  admin@test.com / admin123');
    console.log('  Editor: editor@test.com / editor123');
    console.log('  User:   user@test.com / user123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Greška pri seed-u:', error.message);
    console.error('\nDetalji:', error);
    process.exit(1);
  }
}

seedClient();