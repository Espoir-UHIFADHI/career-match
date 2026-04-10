# Career Match

Application web pour **adapter un CV à une offre d’emploi**, obtenir un **score de correspondance**, des **recommandations** et des outils de **networking** (recherche de contacts, formats d’e-mail, messages). L’IA et les APIs sensibles passent par des **Supabase Edge Functions** ; le front consomme Supabase et Clerk.

**Site** : [careermatch.fr](https://careermatch.fr) (production)

---

## Fonctionnalités

| Domaine | Détail |
|--------|--------|
| **CV & offre** | Upload PDF/TXT, extraction structurée, analyse de l’annonce, score, forces/faiblesses, mots-clés manquants, CV optimisé |
| **Export** | Aperçu imprimable, téléchargement PDF (`@react-pdf/renderer`) |
| **Networking** | Recherche (Serper), prédiction d’e-mails (Hunter + cache Supabase), génération de messages |
| **Compte** | Auth [Clerk](https://clerk.com/), crédits en base [Supabase](https://supabase.com/), achats via Gumroad (webhook + licences) |
| **SEO** | Pages métiers (`/career/:slug`), blog, landing |

---

## Stack technique

- **Front** : React 19, TypeScript, Vite 7, Tailwind CSS 4, React Router 7  
- **État** : Zustand (persistance locale du parcours wizard)  
- **Auth** : Clerk (JWT template nommé `supabase` pour les appels PostgREST / RPC)  
- **Backend** : Supabase (Postgres, RLS, Edge Functions)  
- **IA** : Google Gemini (via fonction `career-match-api`)  
- **APIs** : Serper (recherche), Hunter (domaine / e-mail)  
- **E-mails** : Resend (Edge Functions)  
- **Paiement** : Gumroad  

---

## Prérequis

- Node.js **20+** (recommandé ; Vite 7 / fetch natif)  
- Comptes et projets configurés : **Clerk**, **Supabase** (migrations + secrets des fonctions), clés **Gemini**, **Serper**, **Hunter**, **Resend** selon les fonctions déployées  

---

## Installation

```bash
git clone https://github.com/Espoir-UHIFADHI/career-match.git
cd career-match
npm install
```

### Variables d’environnement (frontend)

Créer un fichier **`.env`** à la racine (non versionné) :

```env
# Obligatoires pour l’app
VITE_CLERK_PUBLISHABLE_KEY=pk_...
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Optionnel — comptes admin (bypass garde-fous crédits côté UI), liste séparée par des virgules
# VITE_ADMIN_EMAILS=admin@exemple.com

# Optionnel — scripts locaux de diagnostic (voir scripts/README.md)
# Les appels IA / Serper / Hunter en prod passent par les secrets Supabase des Edge Functions.
# VITE_GEMINI_API_KEY=
# VITE_SERPER_API_KEY=
```

**Clerk** : créer un modèle JWT nommé exactement **`supabase`** et brancher l’intégration Clerk ↔ Supabase (voir [doc Clerk + Supabase](https://clerk.com/docs/guides/development/integrations/databases/supabase)).

**Supabase** : déployer les fonctions sous `supabase/functions/` et renseigner les secrets (`GEMINI_API_KEY`, `SERPER_API_KEY`, `HUNTER_API_KEY`, `RESEND_API_KEY`, etc.). Le détail est dans [`docs/GUIDE_CESSION.md`](docs/GUIDE_CESSION.md).

### Commandes npm

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur de dev Vite → http://localhost:5173 |
| `npm run build` | `tsc -b` + build production dans `dist/` |
| `npm run typecheck` | Vérification TypeScript (`tsc -b` sans Vite) |
| `npm run preview` | Prévisualiser le build localement |
| `npm run lint` | ESLint sur le dépôt |

---

## Structure du dépôt

| Chemin | Contenu |
|--------|---------|
| `src/` | Application React |
| `public/` | Assets statiques, `robots.txt`, `sitemap.xml` |
| `supabase/migrations/` | Schéma SQL et RPC (crédits, profils, etc.) |
| `supabase/functions/` | Edge Functions (API métier, webhooks, e-mail) ; certaines fonctions ont un `tsconfig.json` + `deno-shims.d.ts` local pour l’IDE TypeScript |
| [`docs/`](docs/) | [PRD](docs/PRD.md), [guide de cession / déploiement](docs/GUIDE_CESSION.md) |
| [`scripts/`](scripts/) | Maintenance et [outils dev](scripts/README.md) |

---

## Documentation

- **Produit & périmètre** : [`docs/PRD.md`](docs/PRD.md)  
- **Transfert de projet, secrets, checklist** : [`docs/GUIDE_CESSION.md`](docs/GUIDE_CESSION.md)  
- **Scripts CLI** : [`scripts/README.md`](scripts/README.md)  
- **Pistes d’évolution** : [`TODO.md`](TODO.md)  

---

## Déploiement

Le dépôt inclut un exemple de configuration **`vercel.json`** (rewrites SPA, en-têtes de sécurité). Adapter domaine, variables `VITE_*` et CSP si vous changez d’hébergeur ou de domaine Clerk.

---

## Licence

MIT

---

## Contribution

Issues et pull requests sont les bienvenues. Merci de lancer `npm run build` avant de proposer une PR.
