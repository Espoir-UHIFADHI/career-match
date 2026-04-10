# Guide complet de cession — Career Match

Ce document décrit **tout ce qu’il faut transférer, reconfigurer, tester et nettoyer** pour céder le projet **Career Match** à un acquéreur (ou à une nouvelle entité), en s’appuyant sur **l’état réel du dépôt** (code, Edge Functions, migrations, fichiers publics).

**Public cible** : toi (cédant), l’acquéreur technique, ou un prestataire de migration.

---

## 1. Objectif et résultat attendu

À la fin de la cession, l’acquéreur doit pouvoir :

- Déployer le **frontend** (typiquement **Vercel** ou équivalent).
- Exécuter **Supabase** (base + **RLS** + **Edge Functions** + **secrets**).
- Configurer **Clerk** (auth + JWT pour Supabase).
- Raccorder **Gumroad** (checkout + webhook + licences).
- Raccorder **Resend**, **Google Gemini**, **Serper**, **Hunter.io**.
- Remplacer **toutes** les références au domaine, e-mails, IDs analytics et comptes personnels présents dans le code ou la config.
- Assumer la **continuité légale/RGPD** des données utilisateurs si la base est transférée.

---

## 2. Architecture résumée (ce qui doit être repris)

```
Utilisateur → DNS (domaine) → Hébergeur SPA (ex. Vercel) → React
                    ↓
              Clerk (auth, session)
                    ↓
              Supabase Postgres (profiles, resumes, caches, public_analyses, used_licenses, …)
                    ↓
              Supabase Edge Functions :
                • career-match-api   (Gemini + Serper + Hunter, vérifie JWT)
                • gumroad-webhook    (crédits après achat, service role)
                • redeem-license     (Gumroad verify API, service role)
                • send-email         (Resend)
                • process-referral   (Resend + DB + point d’attention Auth, voir § 12)
                • sync-resend-contacts (Clerk API + Resend audiences, admin)
```

**Paiement** : redirection vers **Gumroad** avec paramètres `custom_user_id` et `email` (indispensable au webhook).

---

## 3. Inventaire des services tiers (obligatoire)

| Service | Rôle | Obligatoire pour |
|--------|------|------------------|
| **Clerk** | Authentification utilisateur, JWT vers Supabase | Toute l’app `/app` |
| **Supabase** | Base de données, RPC crédits, Edge Functions | Cœur produit |
| **Google AI (Gemini)** | Parsing CV, analyse offre, matching, networking IA | `career-match-api` |
| **Serper** | Recherche Google (networking) | `career-match-api` |
| **Hunter.io** | Domaine / pattern / finder e-mail | `career-match-api` |
| **Gumroad** | Vente de crédits + vérification de clés licence | Monétisation |
| **Resend** | E-mails transactionnels et parrainage | `send-email`, `process-referral`, `sync-resend-contacts` |
| **Hébergeur frontend** (ex. **Vercel**) | SPA + headers/CSP | Site public |
| **Registrar DNS** | Domaine `A`/`CNAME`, éventuellement sous-domaine Clerk | Production |
| **Microsoft Clarity** | Analytics (script dans `index.html`) | Optionnel mais présent |
| **Google Search Console** | Meta `google-site-verification` dans `index.html` | SEO (à remplacer ou retirer) |

**Non bloquant mais référencé dans le code** : polices Google Fonts, images Unsplash (blog), Wikimedia (landing), `grainy-gradients.vercel.app` (décor).

---

## 4. Variables d’environnement — Frontend (Vite / Vercel)

Ces variables sont lues via `import.meta.env` (préfixe **`VITE_`**).

| Variable | Utilisation dans le repo | Obligatoire |
|----------|---------------------------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | `src/components/Providers.tsx` | Oui |
| `VITE_SUPABASE_URL` | `src/services/supabase.ts`, `PublicAnalysis.tsx`, scripts | Oui |
| `VITE_SUPABASE_ANON_KEY` | Idem | Oui |

**Note README** : `README.md` mentionne encore `VITE_GEMINI_API_KEY`. En production actuelle, **Gemini est appelé depuis l’Edge Function** `career-match-api` avec `GEMINI_API_KEY` côté Supabase. `vite.config.ts` peut encore injecter `VITE_GEMINI_API_KEY` pour des scripts locaux — **ne pas exposer une vraie clé Gemini dans le build client** ; la config canonique pour la prod est le **secret Supabase**.

**Fichier local** : créer un `.env` à la racine (non versionné, voir `.gitignore`). Ne jamais commiter les secrets.

---

## 5. Secrets Supabase — Edge Functions

Configurer dans le tableau de bord Supabase : **Project Settings → Edge Functions → Secrets** (ou CLI `supabase secrets set`).

### 5.1 Fonction `career-match-api`

| Secret | Usage |
|--------|--------|
| `SUPABASE_URL` | Fourni par Supabase (souvent injecté automatiquement ; vérifier en prod) |
| `SUPABASE_ANON_KEY` | Vérification JWT utilisateur + lecture `profiles` |
| `GEMINI_API_KEY` | Appels `generativelanguage.googleapis.com` |
| `SERPER_API_KEY` | Appels `google.serper.dev` |
| `HUNTER_API_KEY` | Appels `api.hunter.io` |

### 5.2 Fonction `gumroad-webhook`

| Secret | Usage |
|--------|--------|
| `SUPABASE_URL` | |
| `SUPABASE_SERVICE_ROLE_KEY` | Upsert `profiles` (crédits) — **très sensible** |

### 5.3 Fonction `redeem-license`

| Secret | Usage |
|--------|--------|
| `SUPABASE_URL` | |
| `SUPABASE_SERVICE_ROLE_KEY` | Lecture/écriture `used_licenses`, `profiles` |

**Important** : le code appelle l’API Gumroad `https://api.gumroad.com/v2/licenses/verify` ; l’acquéreur doit avoir les **produits Gumroad** correspondants aux **product_id** dans `supabase/functions/redeem-license/index.ts` (sinon adapter le mapping).

### 5.4 Fonction `send-email`

| Secret | Usage |
|--------|--------|
| `RESEND_API_KEY` | `https://api.resend.com/emails` |

**Expéditeur actuel dans le code** : `from: "Career Match <onboarding@resend.dev>"` (domaine de test Resend). Pour la prod, l’acquéreur doit **vérifier un domaine** dans Resend et remplacer cette valeur dans `supabase/functions/send-email/index.ts`.

### 5.5 Fonction `process-referral`

| Secret | Usage |
|--------|--------|
| `RESEND_API_KEY` | E-mail au parrain |
| `SUPABASE_URL` | |
| `SUPABASE_SERVICE_ROLE_KEY` | Insert `referrals`, MAJ `profiles`, **et** `auth.admin.getUserById` |
| `SUPABASE_ANON_KEY` | Client utilisateur pour valider le JWT appelant |

**E-mail `from` dans le code** : `Career Match <contact@careermatch.fr>` — doit être un domaine **vérifié** chez Resend après cession.

### 5.6 Fonction `sync-resend-contacts`

| Secret | Usage |
|--------|--------|
| `RESEND_API_KEY` | Audiences + contacts |
| `SUPABASE_URL` | |
| `SUPABASE_SERVICE_ROLE_KEY` | Lecture `profiles` |
| `CLERK_SECRET_KEY` | `https://api.clerk.com/v1/users` |

---

## 6. Clerk — configuration indispensable

1. **Application Clerk** (nouvelle ou transfert selon politique Clerk).
2. **Clés** :
   - **Publishable key** → `VITE_CLERK_PUBLISHABLE_KEY` (frontend).
   - **Secret key** → `CLERK_SECRET_KEY` (secret Edge Function `sync-resend-contacts` uniquement dans ce repo).
3. **JWT template nommé exactement `supabase`**  
   Le frontend appelle `getToken({ template: 'supabase' })` (ex. `Wizard.tsx`, `PricingPage.tsx`, etc.).  
   Sans ce template, les appels Supabase authentifiés échouent (message d’erreur explicite dans `Wizard.tsx`).
4. **Intégration Supabase + Clerk**  
   Suivre la documentation officielle Clerk + Supabase (Third-party auth / JWT) pour que **`sub`** du JWT corresponde à **`profiles.id`** (texte) en base.
5. **URLs autorisées** : domaine de prod, `localhost` pour le dev.
6. **Domaine Clerk personnalisé**  
   `vercel.json` référence `https://clerk.careermatch.fr` dans la **CSP**. Après changement de domaine Clerk, **mettre à jour `vercel.json`** (et tout autre CSP).

---

## 7. Supabase — base de données

### 7.1 Migrations dans `supabase/migrations/` (ordre chronologique par préfixe date)

Appliquer sur une base **vide** en respectant l’ordre des fichiers (timestamps) :

| Fichier | Rôle |
|---------|------|
| `20241204_create_email_cache_tables.sql` | `domain_patterns`, `found_emails` |
| `20241204_create_resumes_table.sql` | `resumes` |
| `20241204_fix_resumes_standalone.sql` | Ajustements `resumes` |
| `20241205_change_id_to_text.sql` | Alignement types ID |
| `20241205_reset_schema.sql` | **Destructif** : drop/recreate `profiles` + `resumes` — **ne pas réappliquer** sur une base déjà en prod avec données sauf stratégie de migration explicite |
| `20241205_fix_profiles_rls.sql` | RLS `profiles` |
| `20241205_create_get_user_credits_rpc.sql` | RPC + **7 crédits** à la création profil |
| `20241205_create_decrease_credits_rpc.sql` | RPC débit atomique |
| `20241207_create_used_licenses.sql` | Licences Gumroad |
| `20251211_create_public_analyses.sql` | Partage public |

**Fichiers SQL à la racine `supabase/` (hors `migrations/`)** : `fix_rls_clerk_final.sql`, `fix_cache_rls.sql` — traiter comme **correctifs manuels** à appliquer si la doc interne ou l’historique de déploiement l’exige ; les inclure dans le paquet de cession avec explication.

### 7.2 Table `referrals` (critique)

La fonction Edge **`process-referral`** exécute `insert` et `select` sur la table **`referrals`**.  
**Aucun fichier dans `supabase/migrations/` ne crée cette table** dans le dépôt.  

**Action pour l’acquéreur** : soit récupérer le SQL de création depuis l’instance Supabase actuelle (dump / migration manuelle), soit créer une migration nouvelle avec colonnes cohérentes avec le code :

- Colonnes utilisées dans le code : `referrer_id`, `referred_user_id`, `status`, `completed_at` (et contrainte d’unicité sur le filleul pour idempotence).

Sans cette table, le parrainage **plantera** à l’insertion.

### 7.3 RLS et sécurité (à communiquer)

- `public_analyses` : lecture publique ; politique d’insert large — l’acquéreur doit en connaitre les implications **RGPD** (contenu CV potentiel).
- Ne **jamais** exposer `SUPABASE_SERVICE_ROLE_KEY` au frontend.

---

## 8. Edge Functions — liste et déploiement

Fonctions présentes sous `supabase/functions/` :

| Dossier | Endpoint type |
|---------|----------------|
| `career-match-api` | `/functions/v1/career-match-api` |
| `gumroad-webhook` | `/functions/v1/gumroad-webhook` |
| `redeem-license` | `/functions/v1/redeem-license` |
| `send-email` | `/functions/v1/send-email` |
| `process-referral` | `/functions/v1/process-referral` |
| `sync-resend-contacts` | `/functions/v1/sync-resend-contacts` |

**URL complète** : `https://<PROJECT_REF>.supabase.co/functions/v1/<nom>`

Déploiement typique (machine avec Supabase CLI liée au projet) :

```bash
supabase link --project-ref <PROJECT_REF>
supabase db push   # ou application manuelle des migrations selon votre processus
supabase functions deploy career-match-api
supabase functions deploy gumroad-webhook
supabase functions deploy redeem-license
supabase functions deploy send-email
supabase functions deploy process-referral
supabase functions deploy sync-resend-contacts
```

(L’acquéreur adapte à son CI/CD.)

---

## 9. Gumroad — cession fonctionnelle

### 9.1 Checkout depuis l’app

Fichier : `src/components/PricingPage.tsx`

- URL de base : `https://careermatch.gumroad.com/l/${productSlug}`  
- Slugs utilisés pour les boutons :
  - **`pack-booster`** (+20 crédits)
  - **`career-coach`** (+100 crédits)
- Paramètres query **obligatoires** pour le webhook :
  - `custom_user_id` = **ID utilisateur Clerk**
  - `email` = e-mail principal Clerk

L’acquéreur doit soit **transférer la boutique Gumroad**, soit recréer les produits et **mettre à jour** l’URL de base (`careermatch.gumroad.com` → sa boutique) et les **slugs** dans le code.

### 9.2 Webhook Gumroad

1. Dans Gumroad : configurer le webhook **POST** vers  
   `https://<PROJECT_REF>.supabase.co/functions/v1/gumroad-webhook`
2. Le handler attend du **form data** (comme Gumroad) avec au minimum :
   - `custom_user_id`
   - `permalink` (ou alias codé en dur dans `gumroad-webhook/index.ts`)

Logique des crédits dans `gumroad-webhook/index.ts` :

- Permalink contenant `pack-booster` ou égal à `ezocca` → **+20**
- Permalink contenant `career-coach` ou égal à `kyhjbx` → **+100**

**Sécurité** : le code ne montre pas de vérification de signature Gumroad — **recommandation forte** pour l’acquéreur : ajouter la validation officielle des webhooks Gumroad avant exploitation à grande échelle.

### 9.3 Licences (`redeem-license`)

Le fichier `redeem-license/index.ts` contient des **product_id** Gumroad en dur et une liste de permalinks à tester.  
Lors d’un changement de produits Gumroad, il faut **aligner** ces identifiants ou la vente par code ne fonctionnera plus.

---

## 10. Vercel (ou équivalent) et `vercel.json`

- **Rewrites** : SPA vers `index.html` (déjà configuré).
- **Headers** : CSP et `Access-Control-Allow-Origin: https://www.careermatch.fr` — **à adapter** au nouveau domaine.
- **Variables d’environnement** : `VITE_*` pour le build.

Après changement de domaine : mettre à jour **toutes** les occurrences listées en § 15.

---

## 11. Fichiers statiques SEO

| Fichier | Contenu à mettre à jour |
|---------|-------------------------|
| `public/robots.txt` | `Sitemap: https://careermatch.fr/sitemap.xml` |
| `public/sitemap.xml` | URLs absolues `https://careermatch.fr/...` |
| `scripts/generate-sitemap.js` | `BASE_URL = 'https://careermatch.fr'` |

Régénérer le sitemap si besoin après changement de slugs ou de pages.

---

## 12. Point d’attention technique : `process-referral` et Supabase Auth

Dans `supabase/functions/process-referral/index.ts`, après récompense du parrain, le code appelle :

`supabase.auth.admin.getUserById(referrer_id)`

où `referrer_id` est un **ID Clerk** (stocké côté client dans le lien `?ref=`).

Si vos utilisateurs **n’existent pas** dans `auth.users` Supabase (auth uniquement Clerk sans sync des users dans Supabase Auth), cet appel peut **échouer** et l’e-mail au parrain ne part pas (comportement partiellement géré par les logs).

**Action cession** : en prod, vérifier si l’e-mail parrain est bien envoyé. Si non, prévoir une évolution (ex. récupérer l’e-mail du parrain via **Clerk Backend API** avec `CLERK_SECRET_KEY`, ou stocker l’e-mail du parrain autrement). Documenter l’état réel à l’acquéreur.

---

## 13. Liste exhaustive des chaînes « métier » à remplacer (recherche globale)

Effectuer un remplacement systématique (ou un ticket par fichier) pour le **nouveau domaine / marque / contact**. Emplacements identifiés dans le dépôt :

### 13.1 Domaine `careermatch.fr` et sous-domaines

- `index.html` — `og:url`, `twitter:url`
- `src/components/LandingPage.tsx` — canonical
- `src/components/pages/CareerTemplate.tsx` — canonical
- `src/components/pages/PrivacyPolicy.tsx`, `TermsOfService.tsx`, `Contact.tsx`
- `src/components/PricingPage.tsx` — canonical
- `src/components/Wizard.tsx` — canonical par étape
- `supabase/functions/send-email/index.ts` — liens, image `https://careermatch.fr/career-match.png`, mailto `contact@careermatch.fr`
- `supabase/functions/process-referral/index.ts` — lien + `from: contact@careermatch.fr`
- `public/robots.txt`, `public/sitemap.xml`
- `scripts/generate-sitemap.js`
- `docs/PRD.md` (documentation)

### 13.2 Gumroad

- `src/components/PricingPage.tsx` — `https://careermatch.gumroad.com/l/`

### 13.3 Clerk / CSP

- `vercel.json` — `clerk.careermatch.fr`, `www.careermatch.fr` dans headers

### 13.4 E-mails de support / DPO (traductions)

- `src/i18n/translations.ts` — **`appcareermatch@gmail.com`** (plusieurs clés FR/EN : contact RGPD, support, DPO, etc.)

### 13.5 Compte administrateur « crédits illimités » (à supprimer ou généraliser)

Fichiers contenant **`espoiradouwekonou20@gmail.com`** :

- `src/store/useUserStore.ts` — bypass `useCredit`
- `src/components/Layout.tsx` — affichage `∞` + bloc debug conditionnel
- `src/components/job-input/JobInput.tsx`
- `src/components/networking/NetworkingSearch.tsx`
- `src/components/networking/EmailPredictorTool.tsx`

**Impératif cession** : retirer ces bypass ou les remplacer par un **rôle** géré proprement (Clerk `publicMetadata`, ou table admin), sinon l’acquéreur hérite d’un **backdoor**.

### 13.6 Lien de parrainage affiché aux utilisateurs

- `src/components/results/MatchingDashboard.tsx` — `https://careermatch.fr?ref=`

### 13.7 Microsoft Clarity

- `index.html` — ID de projet dans l’URL du script : `.../tag/uiwllp7pu5`  
L’acquéreur crée son projet Clarity et remplace l’ID.

### 13.8 Google Search Console

- `index.html` — `<meta name="google-site-verification" ...>`  
Remplacer par la balise du nouveau propriétaire ou supprimer.

### 13.9 Scripts de test / internes (nettoyage cédant)

- `scripts/test-webhook-prod.js` contient un **`PROJECT_REF` Supabase** et des identifiants de test — **retirer ou anonymiser** avant partage public du repo ; **rotation** des clés si jamais exposées.

### 13.10 README

- `README.md` — URL GitHub du clone, variables `.env` (harmoniser avec la réalité Supabase Edge pour Gemini).

---

## 14. Scripts du dossier `scripts/`

| Script | Rôle | Prérequis |
|--------|------|-----------|
| `add_credits_to_user.ts` | Ajout manuel de crédits | `VITE_SUPABASE_URL`, clé **service role** ou méthode documentée dans le script |
| `check_credits.ts` | Vérification crédits | `VITE_SUPABASE_URL` + auth appropriée |
| `sync-users_local.ts` | Sync utilisateurs | Variables comme dans le fichier |
| `generate-sitemap.js` | Génération sitemap | `BASE_URL` |
| `verify-resend.ts` | Test Resend | Clé API |
| `test-webhook-prod.js` | Test webhook Gumroad | URL projet + données test — **sanitizer avant cession** |

Lire chaque script avant exécution : ils peuvent nécessiter des **clés sensibles** non présentes dans le `.env` standard du frontend.

---

## 15. Données personnelles et RGPD (cession « avec utilisateurs »)

Si tu transfères **la base Supabase** telle quelle :

1. **Inventaire** : `profiles`, `resumes`, `public_analyses` (contenu potentiellement très sensible), `found_emails`, `domain_patterns`, `used_licenses`, etc.
2. **Base légale** : contrat de cession / DPA entre cédant et acquéreur ; information aux utilisateurs si la loi l’exige.
3. **Clerk** : les comptes restent chez Clerk — prévoir **transfert d’application** ou export selon politique Clerk.
4. **Droits utilisateurs** : les e-mails de contact dans `translations.ts` et les pages légales doivent refléter le **nouveau responsable de traitement**.

Si tu vends **uniquement le code** sans données : fournir une base **vide** + migrations, et effacer les données de l’ancien projet.

---

## 16. Transfert du dépôt Git

1. **Privilégier** un transfert d’organisation GitHub/GitLab ou un export zip **après** nettoyage des secrets.
2. Vérifier l’historique Git : si des clés ont été commitées par erreur, **révoquer** les clés et envisager `git filter-repo` (hors scope détaillé ici).
3. Fichiers à ne jamais versionner : `.env` (déjà dans `.gitignore`).

---

## 17. Checklist de rotation des secrets (cédant)

Après livraison à l’acquéreur, le cédant doit idéalement :

- Régénérer **toutes** les clés : Supabase **service role** / **anon** (si compromis), **Clerk** secret, **Gemini**, **Serper**, **Hunter**, **Resend**, **Gumroad** si applicable.
- Révoquer l’accès aux comptes **Vercel**, **Clerk**, **Supabase**, **Gumroad**, **Resend** pour l’acquéreur s’il repart sur **nouveaux** comptes (sinon transfert de propriété des comptes).

---

## 18. Recette fonctionnelle post-cession (tests)

L’acquéreur valide dans l’ordre :

1. Build : `npm install` && `npm run build` sans erreur.
2. Connexion Clerk sur l’URL de prod.
3. **Template JWT `supabase`** : appel authentifié à une table `profiles` ou RPC `get_user_credits`.
4. Upload CV + parsing (Edge `career-match-api` / action `parse-cv`).
5. Analyse d’offre (1 crédit débité) + résultats matching.
6. Achat test Gumroad (montant minimal) → webhook → crédits augmentés (logs Supabase + ligne `profiles`).
7. Saisie d’une licence test → `redeem-license`.
8. E-mail `match_ready` / mentor (Resend, domaine vérifié).
9. Page `/share/<uuid>` en lecture anonyme.
10. CSP navigateur : pas d’erreurs bloquantes Clerk / Supabase dans la console (ajuster `vercel.json` si besoin).

---

## 19. Livrables recommandés par le cédant (paquet « propre »)

- Ce dépôt **sans** e-mails perso / bypass admin / `PROJECT_REF` dans les scripts de test.
- Liste des **secrets** (noms uniquement, pas les valeurs) et où les coller.
- Export SQL ou note d’ordre d’application des migrations + **script SQL `referrals`** manquant.
- Captures ou courte vidéo : déploiement Vercel + variables.
- Accès **transféré** ou procédure de **re-création** pour chaque service listé § 3.
- Documentation produit dans **`docs/`** (`PRD.md`, `GUIDE_CESSION.md`, `README.md` d’index).

---

## 20. Synthèse des risques connus (à lire avant signature)

| Risque | Détail |
|--------|--------|
| Table `referrals` absente des migrations versionnées | Parrainage cassé sans SQL manuel |
| `process-referral` + `auth.admin.getUserById` | Peut ne pas résoudre l’e-mail du parrain si pas de user Supabase Auth |
| Bypass crédits par e-mail | Backdoor si non retiré |
| Webhook Gumroad sans signature | Fraude possible |
| RLS `public_analyses` | Fuite de données si URLs devinées ; contenu sensible |
| `20241205_reset_schema.sql` | Destructif — ne pas rejouer à l’aveugle |
| README / TODO obsolètes sur clés `VITE_GEMINI` | Confusion pour l’acquéreur |

---

*Document généré à partir du code du dépôt Career Match. À mettre à jour après chaque évolution majeure (nouvelles fonctions, nouvelles variables, nouveau domaine).*
