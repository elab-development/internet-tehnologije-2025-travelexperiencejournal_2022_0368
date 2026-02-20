# Bezbednosne mere — Travel Experience Journal

## 1. XSS (Cross-Site Scripting) zaštita
- **Implementacija:** `lib/security/sanitize.ts`
- **Opis:** Sav korisnički input se sanitizuje pre čuvanja u bazu
  korišćenjem DOMPurify biblioteke. Uklanjaju se svi HTML tagovi
  i atributi.
- **Gde se primenjuje:** Sve POST/PUT API rute (posts, comments,
  destinations, profile, register)
- **Dodatno:** Content-Security-Policy header ograničava izvore
  skripti, React automatski escapeuje output

## 2. CSRF (Cross-Site Request Forgery) zaštita
- **Implementacija:** `lib/security/csrf.ts` + `middleware.ts`
- **Opis:** Middleware proverava Origin i Referer headere na svim
  mutacionim zahtevima (POST, PUT, DELETE). Zahtevi sa nepoznatog
  origina se odbijaju sa 403.
- **Dodatno:** NextAuth ima ugrađenu CSRF zaštitu za auth rute

## 3. IDOR (Insecure Direct Object Reference) zaštita
- **Implementacija:** `lib/security/idor.ts`
- **Opis:** Centralizovana provera autorizacije — korisnik može
  da modifikuje samo sopstvene resurse (putopise, profil). Admin
  ima pristup svemu, editor može da uređuje putopise.
- **Logovanje:** Sumnjivi pokušaji pristupa se loguju na serveru

## 4. Rate Limiting
- **Implementacija:** `lib/security/rateLimiter.ts` +
  `lib/security/withRateLimit.ts`
- **Opis:** Tri nivoa rate limitinga:
  - Auth rute: 10 zahteva/minut (brute-force zaštita)
  - Mutacione rute: 30 zahteva/minut
  - Generalno: 100 zahteva/minut
- **Response:** HTTP 429 sa Retry-After headerom

## 5. Security Headers (CORS + CSP + ostalo)
- **Implementacija:** `next.config.js` → headers()
- **Headeri:**
  - `X-Frame-Options: DENY` — sprečava clickjacking
  - `X-Content-Type-Options: nosniff` — sprečava MIME sniffing
  - `X-XSS-Protection: 1; mode=block` — browser XSS filter
  - `Strict-Transport-Security` — forsira HTTPS
  - `Content-Security-Policy` — ograničava izvore sadržaja
  - `Referrer-Policy` — kontroliše Referer header
  - `Permissions-Policy` — ograničava API-je browsera
  - CORS headeri na `/api/*` rutama
