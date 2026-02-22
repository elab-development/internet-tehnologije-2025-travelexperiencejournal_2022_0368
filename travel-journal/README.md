# Travel Experience Journal

## O aplikaciji

U savremenom svetu putovanja, korisnici se suočavaju sa fragmentiranim iskustvom pri deljenju i pretraživanju autentičnih putnih iskustava. Klasični blogovi zahtevaju tehničko znanje, društvene mreže nemaju strukturu specifičnu za putopise, a forumi često nedostaju moderne funkcionalnosti. Postoji potreba za centralizovanom platformom koja omogućava jednostavno kreiranje, organizovanje i deljenje putničkih iskustava uz interakciju sa zajednicom.

**Travel Experience Journal** kombinuje elemente CMS-a sa funkcionalnostima društvene mreže. Korisnici mogu kreirati putopise, dodavati destinacije, ocenjivati lokacije i deliti fotografije – sve na jednom mestu. Platforma primenjuje cloud i edge computing principe za optimalne performanse.

**Ciljevi aplikacije:**
- Omogućiti jednostavno kreiranje i uređivanje putopisa
- Centralizovati informacije o destinacijama kroz korisničke iskaze
- Obezbediti interaktivno okruženje (komentari, ocene, fotografije)
- Demonstrirati praktičnu primenu modernih web tehnologija (Next.js, Firebase)

---

## Tehnologije

| Sloj | Tehnologija |
|------|-------------|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Stilizovanje | Tailwind CSS |
| Backend | Next.js API Routes, NextAuth.js 4 |
| Baza podataka | Firebase Firestore |
| Autentifikacija | Firebase Auth + NextAuth (JWT) |
| Mape | Leaflet + OpenStreetMap |
| Slike | Unsplash API, Sharp |
| Rate limiting | Redis + rate-limiter-flexible |
| Testiranje | Jest + React Testing Library |
| CI/CD | GitHub Actions |
| Deployment | Vercel, Docker |

---

## Pokretanje aplikacije

### Preduslovi i konfiguracija

Kopirati `.env.example` u `.env.local` i popuniti vrednosti (Firebase kredencijali, NextAuth secret, Unsplash API ključ):

```bash
cp .env.example .env.local
```

---

### 1. Lokalno (npm run dev)

**Preduslovi:** Node.js 20+, npm

```bash
git clone https://github.com/elab-development/internet-tehnologije-2025-travelexperiencejournal_2022_0368.git
cd internet-tehnologije-2025-travelexperiencejournal_2022_0368/travel-journal
npm install
npm run dev
```

Aplikacija je dostupna na **http://localhost:3000**

---

### 2. Docker

**Preduslovi:** Docker, Docker Compose

Pre pokretanja, popuniti environment varijable u `docker-compose.yml` (Firebase kredencijali, `NEXTAUTH_SECRET`, `UNSPLASH_ACCESS_KEY`).

```bash
cd travel-journal
docker-compose up --build
```

Aplikacija je dostupna na **http://localhost:3000**

Za zaustavljanje: `docker-compose down`

Docker Compose pokreće dva servisa:
- **app** – Next.js aplikacija (port 3000)
- **redis** – Redis 7 za rate limiting (port 6379)

---

### 3. Vercel (cloud)

Produkciona verzija je deployovana i dostupna na:

**https://travel-journal-beryl-gamma.vercel.app**

Nije potrebna nikakva lokalna konfiguracija za pristup produkcijskoj verziji.
