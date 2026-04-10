# PRD — Career Match

**Document** : Product Requirements Document  
**Produit** : Career Match  
**Domaine cible** : careermatch.fr  
**Source** : analyse du dépôt `career-match` (code + migrations Supabase)

---

## 1. Résumé exécutif

Career Match est une application web **B2C** qui aide les candidats à **adapter leur CV à une offre**, à **obtenir un score de correspondance** et des **recommandations**, et à **outiller le networking** (recherche de contacts, formats d’e-mail, messages). Le produit repose sur **l’IA (Google Gemini)** et des APIs tierces (**Serper**, **Hunter**), avec **authentification Clerk**, persistance **Supabase**, et **monétisation par crédits** via **Gumroad** (achat + codes licence).

---

## 2. Vision et objectifs

| Objectif | Description |
|----------|-------------|
| **Augmenter le taux d’entretiens** | Aligner CV et offre, mots-clés ATS, version optimisée exportable (PDF / impression). |
| **Réduire la friction** | Parcours guidé en étapes, sauvegarde locale du wizard, bilingue FR/EN. |
| **Monétiser l’usage** | Crédits pour actions « coûteuses » (analyse d’offre, recherche networking, prédiction d’e-mail). |
| **Acquisition SEO** | Pages métiers dynamiques (`/career/:slug`), blog statique, landing avec CTA connexion. |

---

## 3. Personas

1. **Candidat actif** — veut un CV aligné sur une offre précise et un score + plan d’action.  
2. **Candidat « outbound »** — cherche contacts LinkedIn / e-mails et modèles de messages.  
3. **Visiteur SEO** — arrive via une page métier ou le blog, se convertit en inscription.  
4. **Mentor / tiers** — reçoit un lien public (`/share/:id`) ou une invitation e-mail pour voir l’analyse ou le CV optimisé.

---

## 4. Périmètre fonctionnel

### 4.1 Inclus (implémenté)

- **Landing** : hero, redirection des utilisateurs connectés vers `/app`, section QuickScan.  
- **Application principale** (`/app`, Wizard) :  
  - **Étape 1** — Upload CV (PDF/TXT), parsing IA, relecture / édition.  
  - **Étape 2** — Saisie description de poste, analyse structurée de l’offre (débit crédit côté UI).  
  - **Étape 3** — Tableau de bord d’analyse / matching.  
  - **Étape 4** — Résultats : score, forces/faiblesses, mots-clés manquants, recommandations, CV optimisé, aperçu imprimable, téléchargement PDF, partage public, invitation mentor par e-mail.  
- **Networking avancé** : recherche type « contacts clés » (Serper), Email Predictor (Hunter + patterns + cache).  
- **Pages** : tarifs, confidentialité, CGU, contact, à propos.  
- **Blog** : `/blog`, `/blog/:slug` (données statiques).  
- **SEO métiers** : `/career/:slug` (données JSON).  
- **Partage** : `/share/:id` ; `?mode=cv` pour le CV optimisé.  
- **Auth** : Clerk (localisation selon langue app).  
- **Crédits** : `profiles.credits`, RPC `get_user_credits` / `decrease_user_credits`, webhook Gumroad, `redeem-license`.  
- **Parrainage** : `?ref=`, edge function `process-referral`.  
- **Analytics** : Microsoft Clarity (`trackEvent`).  
- **E-mails transactionnels** : `send-email` + service front.

### 4.2 Partiel / roadmap implicite

- Vérification d’e-mail Hunter : backend expose `hunter-email-verifier` ; couverture UI à confirmer.  
- Mode démo : `DemoModal` présent ; intégration à valider.

### 4.3 Hors périmètre explicite

- ATS intégrés (Greenhouse, Lever, etc.).  
- Board de candidatures multi-offres côté serveur.  
- Application mobile native.

---

## 5. Parcours utilisateur clés

1. **Onboarding** : visiteur → Clerk → `/app` → upload CV → analyse offre → résultats.  
2. **Achat de crédits** : `/pricing` → Gumroad (`custom_user_id`, e-mail) → webhook → refresh crédits au focus fenêtre.  
3. **Partage** : insert `public_analyses` → lien `/share/{uuid}`.  
4. **Mentor** : e-mail avec lien `?mode=cv` si CV optimisé présent.  
5. **Parrainage** : `?ref={clerk_user_id}` en `localStorage` puis traitement après connexion.

---

## 6. Exigences fonctionnelles

### 6.1 Authentification

- **FR-AUTH-1** : Inscription / connexion via Clerk.  
- **FR-AUTH-2** : Client Supabase avec JWT Clerk template **`supabase`**.  
- **FR-AUTH-3** : Déconnexion → reset wizard + `userId`.

### 6.2 Wizard CV / offre / analyse

- **FR-CV-1** : PDF et TXT → backend `parse-cv` (Gemini).  
- **FR-CV-2** : Conserver LinkedIn existant si l’extraction ne le retourne pas.  
- **FR-JOB-1** : `analyze-job` après débit de **1 crédit** (hors exceptions admin — voir risques).  
- **FR-MATCH-1** : `optimize-cv` avec CV + job structuré ; score, analyse multilingue optionnelle, CV optimisé.  
- **FR-MATCH-2** : E-mail « match prêt » au premier run réussi (si e-mail utilisateur connu).  
- **FR-EXPORT-1** : PDF (`@react-pdf/renderer`) et impression navigateur.

### 6.3 Networking et e-mail

- **FR-NET-1** : `generate-networking-queries` (IA).  
- **FR-NET-2** : Recherche via Serper ; débit crédit sur le flux `NetworkingSearch` (à distinguer de la section LinkedIn légère sur le dashboard).  
- **FR-MAIL-1** : Email predictor : Hunter, patterns, cache (`domain_patterns`, `found_emails`).  
- **FR-MAIL-2** : Actions Hunter domain / finder / verifier exposées côté API.

### 6.4 Monétisation

- **FR-PAY-1** : Nouveau profil : **7 crédits** via `get_user_credits` (création `profiles`).  
- **FR-PAY-2** : Packs Gumroad **+20** (booster) et **+100** (coach) mappés par permalink (webhook).  
- **FR-PAY-3** : Rachat licence Gumroad via `redeem-license` + `used_licenses`.  
- **FR-PAY-4** : Modal crédits insuffisants + tracking analytics.

### 6.5 Partage public

- **FR-SHARE-1** : Lecture publique `public_analyses` par UUID.  
- **FR-SHARE-2** : Insertion par utilisateur authentifié (données sensibles — voir sécurité).

### 6.6 Contenu éditorial

- **FR-SEO-1** : Pages `/career/:slug` depuis JSON.  
- **FR-BLOG-1** : Articles bilingues statiques.

---

## 7. Exigences non fonctionnelles

| Domaine | Attente |
|--------|---------|
| **Performance** | Vite + React 19 ; IA via Edge Function. |
| **Disponibilité** | Dépendances : Vercel, Supabase, Clerk, Google / Hunter / Serper. |
| **i18n** | FR par défaut (store) ; `translations.ts` ; Clerk localisé. |
| **Sécurité** | CSP / headers dans `vercel.json` ; CORS sur edge functions à durcir en prod. |
| **Accessibilité** | Audit recommandé (non spécifié dans le repo). |

---

## 8. Modèle de données (logique)

- **`profiles`** : `id` (text, Clerk), `credits`, `created_at`.  
- **`resumes`** : `user_id` PK → `profiles`, `content` JSONB, timestamps.  
- **`public_analyses`** : UUID, `user_id` optionnel, `content` JSONB, `career_slug`.  
- **`domain_patterns`**, **`found_emails`** : cache.  
- **`used_licenses`** : licences consommées.  
- **`referrals`** : utilisé par `process-referral` — **vérifier présence en base** (non garanti par les migrations listées dans le dépôt).

---

## 9. Architecture technique

```
Navigateur (React + Zustand persist)
  → Clerk
  → Supabase client (JWT Clerk) : tables, RPC, insertions
  → Edge Functions Supabase :
       career-match-api (Gemini, Serper, Hunter)
       gumroad-webhook, redeem-license, process-referral, send-email, sync-resend-contacts
```

**Stack** : React 19, TypeScript, Tailwind 4, React Router 7, Zod, Supabase JS, Clerk React.

---

## 10. Métriques produit (suggestions)

- Inscriptions / activation (premier parse CV ou première analyse offre).  
- Conversion « crédits épuisés » → tarifs.  
- Complétion des 4 étapes du wizard.  
- Partages créés / visites `/share/...`.  
- Événements Clarity existants (`pricing_button_click`, `start_analysis`, etc.).

---

## 11. Hypothèses et dépendances

- Template JWT Clerk **`supabase`** aligné avec Supabase (`sub` = `profiles.id`).  
- Migrations Supabase appliquées (y compris tables non versionnées ici si besoin).  
- Produits Gumroad synchronisés avec webhook et `redeem-license`.

---

## 12. Analyses et observations

### Points forts

- Stack moderne et typage métier (Zod).  
- Clés API sensibles côté **`career-match-api`** (pas exposées en `VITE_` pour Gemini/Serper/Hunter).  
- Débit crédit atomique via RPC `decrease_user_credits`.  
- Socle SEO (métiers + blog + landing).  
- Boucles partage / mentor.

### Écarts doc / code

- L’**optimisation CV + score** (`matchAndOptimize`) **ne consomme pas de crédit** dans le code actuel, alors que l’**analyse d’offre** en consomme 1 — à aligner produit, UI tarifaire et README.  
- **NetworkingSection** (aperçu LinkedIn sur les résultats) peut appeler Serper **sans** débit crédit visible — risque coût API si non voulu.  
- **Parsing CV** : pas de débit crédit.

### Risques sécurité / conformité

- **Bypass crédits** : configurable via **`VITE_ADMIN_EMAILS`** et `src/lib/adminUsers.ts` (liste d’e-mails ; défaut historique si la variable est absente) — pour une cession stricte : vider la variable ou remplacer par un **rôle** Clerk / flag base.  
- **`public_analyses`** : politique d’insert permissive — restreindre / quota / modération si besoin.  
- **Webhook Gumroad** : vérifier **signature** côté prod.  
- **CORS `*`** sur edge functions : resserrer avec l’origine prod.  
- **RGPD** : contenu CV dans analyses publiques — rétention, effacement, mentions légales.

### Dette technique

- Table **`referrals`** absente des migrations du dépôt — risque sur nouvel environnement.  
- `console.log` résiduels ; quelques types `any`.  
- `TODO.md` à la racine : pistes et dette résiduelle ; la section « Déjà en place » confirme que les flux sensibles passent par l’edge function.

### Synthèse

Career Match est une SPA structurée autour d’un wizard métier, avec monétisation Gumroad/Supabase et IA centralisée. Priorités recommandées : **harmoniser la politique de crédits** (y compris appels Serper « gratuits »), **durcir RLS et webhook Gumroad**, **versionner le schéma `referrals`** si le parrainage est maintenu, et **finaliser le bypass admin** (env prod + option rôle Clerk) si besoin conformité cession.

---

*Document généré à partir de l’état du code au moment de la rédaction ; à réviser après chaque release majeure.*
