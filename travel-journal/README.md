# ✈️ Travel Experience Journal

Veb platforma za deljenje putničkih iskustava. Korisnici kreiraju putopise, ocenjuju destinacije, ostavljaju komentare i istražuju mapu destinacija.

![CI/CD](https://github.com/elab-development/internet-tehnologije-2025-travelexperiencejournal_2022_0368/actions/workflows/ci.yml/badge.svg)

## Tehnologije
| Sloj | Tehnologija |
|------|-------------|
| Frontend | Next.js 14 (App Router), React, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, NextAuth.js |
| Baza | Firebase Firestore |
| Auth | Firebase Auth + NextAuth (JWT) |
| Mape | Leaflet + OpenStreetMap + Nominatim geocoding |
| Slike | Unsplash API |
| Grafici | Chart.js |
| Testovi | Jest, React Testing Library |
| CI/CD | GitHub Actions |
| Deploy | Vercel |
| Kontejnerizacija | Docker, docker-compose |

---

## Funkcionalnosti

- Registracija i prijava (3 uloge: user, editor, admin)
- CRUD putopisa sa destinacijama
- Komentarisanje putopisa
- Ocenjivanje destinacija (1-5 zvezdica)
- Interaktivna mapa sa custom markerima
- Automatske slike destinacija (Unsplash)
- Statistike platforme (bar, doughnut, horizontal bar chart)
- Swagger API dokumentacija (`/api-docs`)
- Bezbednost: XSS, CSRF, IDOR, rate limiting, security headers

---

## Pokretanje

### Preduslovi
- Node.js 18+
- npm
- Firebase projekat ([console.firebase.google.com](https://console.firebase.google.com))
- Unsplash API key ([unsplash.com/developers](https://unsplash.com/developers))

### Env varijable
Kopiraj `.env.example` u `.env.local` i popuni vrednosti:
```bash
cp .env.example .env.local
```

---

### 1. Lokalno (`npm run dev`)
```bash
git clone https://github.com/elab-development/internet-tehnologije-2025-travelexperiencejournal_2022_0368.git
cd internet-tehnologije-2025-travelexperiencejournal_2022_0368/travel-journal
npm install
npm run dev
```
Otvori: **http://localhost:3000**

---

### 2. Docker
```bash
cd travel-journal
cp .env.example .env
docker-compose up --build
```
Otvori: **http://localhost:3000**
Zaustavi: `docker-compose down`

---

### 3. Cloud (Vercel)
Produkciona verzija je deployovana na:
**https://travel-journal-xxx.vercel.app**
_(Link će biti ažuriran nakon deploya)_

---

## Testovi
```bash
npm test                # svi testovi
npm run test:backend    # samo API testovi
npm run test:frontend   # samo UI testovi
```

---

## API dokumentacija
Swagger UI je dostupan na `/api-docs` (lokalno: http://localhost:3000/api-docs).

---

## Test korisnici (seed)
| Uloga | Email | Lozinka |
|-------|-------|---------|
| Admin | admin@travel.com | admin123 |
| Editor | editor@travel.com | editor123 |
| User | user@travel.com | user123 |

Seed: `npm run seed`

---

## Struktura projekta
```
travel-journal/
├── app/                  # Next.js stranice i API rute
│   ├── api/              # REST API (posts, comments, destinations, ratings, stats, auth, profile)
│   ├── (auth)/           # Login, Register stranice
│   ├── dashboard/        # Početna stranica
│   ├── posts/            # Kreiranje, pregled, izmena putopisa
│   ├── destinations/     # Mapa destinacija
│   ├── stats/            # Statistike sa grafikonima
│   └── api-docs/         # Swagger dokumentacija
├── components/           # React komponente
│   ├── ui/               # Button, Card, Input, Select, RatingStars
│   ├── layout/           # Navbar
│   ├── dashboard/        # PostCard
│   ├── posts/            # CommentSection, PostActions, DeleteModal, RatingSection
│   ├── map/              # DestinationMap (Leaflet)
│   └── charts/           # PostsPerMonth, TopDestinations, Ratings chart
├── lib/                  # Pomoćne biblioteke
│   ├── firebase/         # Firebase config i admin SDK
│   ├── auth/             # NextAuth konfiguracija
│   ├── types/            # TypeScript tipovi (User, Post, Comment, Destination, Rating)
│   ├── validation/       # Zod šeme
│   ├── security/         # XSS, CSRF, IDOR, rate limiting
│   └── external/         # Unsplash, geocoding
├── __tests__/            # Jest testovi (API + komponente)
├── Dockerfile            # Multi-stage Docker build
├── docker-compose.yml    # App + Redis
└── SECURITY.md           # Dokumentacija bezbednosnih mera
```

---

## Git workflow
```
main ← develop ← feature/*
```
Grane: `feature/testing-ci`, `feature/docker-swagger`, `feature/external-apis`, `feature/security`, `feature/visualization`
