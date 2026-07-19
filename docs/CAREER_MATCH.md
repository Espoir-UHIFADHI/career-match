# Career Match — Documentation complète de l'application

**Produit** : Career Match  
**Type** : application web SaaS B2C pour candidats  
**Domaine de production** : `careermatch.fr`  
**Objectif du document** : permettre à une personne qui découvre le projet de comprendre le produit, les parcours utilisateur, l'architecture, les données, les services externes, la monétisation, la sécurité et les points de maintenance.

---

## 1. Résumé simple

Career Match aide un candidat à transformer une candidature générique en candidature ciblée.

L'utilisateur charge son CV, colle une offre d'emploi, puis l'application :

- extrait les informations importantes du CV ;
- analyse les exigences de l'offre ;
- calcule un score de correspondance entre le CV et le poste ;
- identifie les forces, les faiblesses, les mots-clés manquants et l'adéquation culturelle ;
- génère un CV optimisé ;
- permet d'exporter, imprimer ou partager les résultats ;
- aide à trouver des contacts LinkedIn et à préparer des messages de networking ;
- propose un outil de prédiction d'e-mail professionnel.

Le produit est monétisé par crédits. Les opérations coûteuses, notamment les appels IA, la recherche et Hunter, consomment des crédits. Les achats passent par Gumroad et les crédits sont stockés dans Supabase.

---

## 2. À qui sert l'application ?

### 2.1 Candidat actif

Il possède une offre précise et veut savoir si son CV est aligné. Son besoin principal est d'améliorer ses chances de passer les filtres ATS et d'obtenir un entretien.

### 2.2 Candidat en prospection

Il ne veut pas seulement postuler en ligne. Il cherche des recruteurs, managers, employés ou alumni afin de demander une recommandation, une information ou un échange.

### 2.3 Visiteur SEO

Il arrive depuis une page métier, un article de blog ou la landing page. Le but est de l'amener vers l'inscription et l'analyse de son profil.

### 2.4 Mentor, coach ou tiers

Il reçoit un lien public vers une analyse ou un CV optimisé. Il peut relire le résultat sans compte utilisateur.

---

## 3. Promesse produit

Career Match donne au candidat une lecture concrète de son alignement avec une offre :

- score lisible de `0` à `100` ;
- mots-clés ATS à ajouter ;
- compétences fortes déjà présentes ;
- compétences ou preuves manquantes ;
- recommandations actionnables ;
- CV réécrit dans une structure plus adaptée au poste ;
- contacts pertinents à approcher dans l'entreprise cible ;
- messages de prise de contact.

L'application ne remplace pas le candidat. Elle structure, analyse et reformule à partir des informations fournies.

---

## 4. Fonctionnalités principales

### 4.1 Landing page

La page d'accueil présente le produit, explique la valeur pour les candidats et redirige vers l'application. Elle contient aussi un module de type Quick Scan pour donner une première idée de la valeur.

Fichiers principaux :

- `src/components/LandingPage.tsx`
- `src/components/QuickScan.tsx`

### 4.2 Authentification

L'authentification est gérée par Clerk. L'application utilise aussi un token Clerk compatible Supabase via un template JWT nommé exactement `supabase`.

Sans ce template, les appels authentifiés aux tables, RPC et Edge Functions Supabase ne fonctionnent pas correctement.

Fichiers principaux :

- `src/components/Providers.tsx`
- `src/components/Wizard.tsx`
- `src/services/supabase.ts`

### 4.3 Wizard CV, offre et résultats

Le coeur de l'application est un parcours en quatre étapes sur `/app`.

1. Upload et parsing du CV.
2. Collage et analyse de l'offre d'emploi.
3. Génération du matching.
4. Consultation, export, partage et networking.

L'état du wizard est persisté localement avec Zustand, ce qui permet de conserver les données entre deux rechargements de page.

Fichiers principaux :

- `src/components/Wizard.tsx`
- `src/store/useAppStore.ts`
- `src/store/useUserStore.ts`

### 4.4 Upload et parsing du CV

L'utilisateur charge un fichier PDF ou TXT. Le front convertit le fichier, extrait si possible le texte PDF côté navigateur, puis envoie le contenu à l'Edge Function `career-match-api` avec l'action `parse-cv`.

L'IA retourne une structure de CV normalisée :

- coordonnées ;
- titre ou accroche ;
- résumé ;
- compétences techniques ;
- compétences comportementales ;
- expériences ;
- formations ;
- langues ;
- certifications ;
- centres d'intérêt.

Après extraction, l'utilisateur passe par un écran de relecture pour corriger ou compléter les informations avant de continuer.

Fichiers principaux :

- `src/components/cv-form/CVUpload.tsx`
- `src/components/cv-form/CVReview.tsx`
- `src/lib/pdf-parser.ts`
- `src/services/ai/gemini.ts`
- `src/types/index.ts`

### 4.5 Analyse de l'offre

L'utilisateur colle la description d'un poste. L'application appelle l'action `analyze-job`, qui transforme le texte en objet structuré :

- titre ;
- entreprise ;
- description synthétique ;
- hard skills ;
- soft skills ;
- culture ;
- niveau d'expérience ;
- contenu multilingue lorsque disponible.

Le résultat est affiché à l'utilisateur avant de lancer le matching.

Fichier principal :

- `src/components/job-input/JobInput.tsx`

### 4.6 Matching et optimisation du CV

Le matching compare le CV structuré avec l'offre structurée. L'action `optimize-cv` retourne :

- un score de correspondance ;
- les forces du candidat ;
- les faiblesses ;
- les mots-clés manquants ;
- l'adéquation culturelle ;
- des recommandations ;
- un CV optimisé si le modèle peut produire une version cohérente ;
- des variantes FR/EN lorsque disponibles.

Fichiers principaux :

- `src/components/results/MatchingDashboard.tsx`
- `src/components/results/PrintableCV.tsx`
- `src/components/results/CVDocument.tsx`
- `src/services/ai/gemini.ts`

### 4.7 Export du CV

L'utilisateur peut :

- visualiser le CV optimisé ;
- imprimer via le navigateur ;
- télécharger un PDF généré avec `@react-pdf/renderer`.

Deux rendus existent :

- un rendu React destiné à l'affichage et à l'impression ;
- un rendu PDF destiné au téléchargement.

Fichiers principaux :

- `src/components/results/PrintableCV.tsx`
- `src/components/results/CVDocument.tsx`
- `src/components/Wizard.tsx`

### 4.8 Partage public

L'utilisateur peut créer un lien public vers une analyse. Les données sensibles du CV optimisé sont minimisées avant insertion : e-mail, téléphone, LinkedIn et site web sont vidés.

Les liens publics :

- sont stockés dans `public_analyses` ;
- expirent par défaut après 30 jours côté UI ;
- peuvent être révoqués ;
- peuvent afficher l'analyse ou, avec `?mode=cv`, le CV optimisé.

Fichiers principaux :

- `src/components/results/MatchingDashboard.tsx`
- `src/components/share/PublicAnalysis.tsx`
- `supabase/migrations/20251211090000_create_public_analyses.sql`
- `supabase/migrations/20260425090200_harden_public_analyses.sql`

### 4.9 Invitation mentor

Depuis les résultats, l'utilisateur peut inviter un mentor par e-mail. L'application crée ou réutilise un lien public, puis appelle la fonction d'e-mail transactionnel.

Le lien envoyé au mentor force le mode CV avec `?mode=cv`.

Fichiers principaux :

- `src/components/results/MatchingDashboard.tsx`
- `src/services/emailService.ts`
- `supabase/functions/send-email/index.ts`

### 4.10 Networking

Le module networking aide le candidat à identifier des personnes à contacter dans l'entreprise cible.

Il permet de chercher :

- recruteurs ;
- managers ou décideurs ;
- employés proches du rôle ;
- profils internes ou alumni ;
- tous les profils pertinents.

Le système combine :

- génération de requêtes par IA ;
- recherches Google via Serper ;
- filtrage LinkedIn ;
- déduplication ;
- score de pertinence ;
- catégorisation par persona ;
- export Excel ;
- sauvegarde dans un mini-CRM.

Fichiers principaux :

- `src/components/networking/NetworkingSearch.tsx`
- `src/components/networking/NetworkingGuide.tsx`
- `src/components/results/NetworkingSection.tsx`
- `src/services/search/serper.ts`
- `src/services/networking/searchQueries.ts`

**Landing page dédiée Google Ads (Networking)** :

- `src/components/pages/LandingPageNetworking.tsx` — accessible sur `/lp/networking`, noindex.
  Même structure que `/lp/cv-ats` (navbar, hero + CoachAvatar, bénéfices, section démo dark, CTA final).
  Le CTA principal appelle `setStep(5)` → `NetworkingSearch`.
  La section démo dark reproduit visuellement le formulaire Networking (entreprise + rôle + localisation + contacts simulés).
- `src/services/networking/quality.ts`
- `src/services/networking/crm.ts`

### 4.11 Mini-CRM networking

Le CRM networking permet de garder des contacts liés à une offre ou à une recherche. Pour chaque contact, l'utilisateur peut suivre :

- le statut (`to_contact`, `contacted`, `followed_up`, `replied`, `not_relevant`) ;
- les tags ;
- les notes ;
- la prochaine relance ;
- les messages générés ;
- les messages copiés.

Les données sont stockées dans Supabase avec RLS par utilisateur.

Fichiers principaux :

- `src/services/networking/crm.ts`
- `supabase/migrations/20260424090000_create_networking_crm.sql`

### 4.12 Génération de messages networking

Le module peut générer une séquence de messages personnalisés à partir :

- du profil du candidat ;
- du poste visé ;
- du contact sélectionné ;
- du canal LinkedIn ou e-mail ;
- de l'objectif ;
- du ton ;
- des preuves ou points de personnalisation.

Les actions IA associées sont :

- `generate-networking-message`
- `generate-networking-message-variants`
- `generate-networking-sequence`

### 4.13 Email Predictor

L'Email Predictor aide à trouver ou déduire l'adresse e-mail professionnelle d'une personne.

Il utilise :

- Hunter pour chercher un domaine ;
- Hunter Email Finder pour chercher une adresse ;
- Hunter Email Verifier pour vérifier une adresse ;
- un cache Supabase pour les domaines, patterns et e-mails déjà trouvés.

Fichiers principaux :

- `src/components/networking/EmailPredictorTool.tsx`
- `src/services/emailService.ts`
- `supabase/migrations/20241204090000_create_email_cache_tables.sql`
- `supabase/migrations/20260425090400_harden_email_cache_rls.sql`

### 4.14 Tarifs, crédits et achats

Chaque nouvel utilisateur obtient 3 crédits au premier appel à `get_user_credits`.

Les offres visibles dans l'application sont :

- gratuit : 3 crédits ;
- booster : +20 crédits ;
- coach : +100 crédits.

Les achats passent par Gumroad. Le front ouvre une URL Gumroad avec :

- `custom_user_id` : ID Clerk de l'utilisateur ;
- `email` : e-mail principal Clerk.

Le webhook Gumroad ajoute ensuite les crédits via Supabase.

Fichiers principaux :

- `src/components/PricingPage.tsx`
- `supabase/functions/gumroad-webhook/index.ts`
- `supabase/functions/redeem-license/index.ts`
- `supabase/migrations/20260425090100_create_credit_grants_rpc.sql`

### 4.15 Codes licence

La page tarifs permet de saisir une clé licence Gumroad. La fonction `redeem-license` vérifie la clé auprès de Gumroad, vérifie qu'elle n'est pas déjà utilisée, puis crédite l'utilisateur.

Les licences consommées sont stockées dans `used_licenses`.

Fichiers principaux :

- `src/components/PricingPage.tsx`
- `supabase/functions/redeem-license/index.ts`
- `supabase/migrations/20241207090000_create_used_licenses.sql`

### 4.16 Parrainage

Le lien de parrainage utilise le paramètre `?ref=`.

Le fonctionnement général :

1. Le visiteur arrive avec `?ref=<clerk_user_id>`.
2. L'ID du parrain est stocké en `localStorage`.
3. Après connexion, l'application appelle `process-referral`.
4. La fonction crée une ligne dans `referrals`.
5. La fonction crédite le parrain si le parrainage est valide.
6. Un e-mail peut être envoyé au parrain.

Fichiers principaux :

- `src/components/Wizard.tsx`
- `supabase/functions/process-referral/index.ts`
- `supabase/migrations/20260425090300_create_referrals_table.sql`

### 4.17 Pages publiques et SEO

L'application contient plusieurs pages publiques :

- `/` : landing page principale ;
- `/pricing` : tarifs ;
- `/about` : à propos ;
- `/contact` : contact ;
- `/privacy` : confidentialité ;
- `/terms` : CGU ;
- `/blog` : liste des articles ;
- `/blog/:slug` : article ;
- `/career/:slug` : page métier SEO ;
- `/share/:id` : analyse ou CV partagé ;
- `/lp/cv-ats` : landing page dédiée Google Ads — angle CV/ATS (noindex, pas de nav globale) ;
- `/lp/networking` : landing page dédiée Google Ads — angle Réseautage / contact direct (noindex, pas de nav globale).

Les pages métier sont alimentées par un fichier JSON.

Fichiers principaux :

- `src/App.tsx`
- `src/components/pages/*.tsx`
- `src/data/blogPosts.ts`
- `src/data/seo-careers.json`

### 4.18 Internationalisation

L'application est bilingue FR/EN. La langue par défaut du store applicatif est `French`, tandis que le hook de traduction expose les labels d'interface selon la langue active.

Clerk est aussi localisé selon la langue.

Fichiers principaux :

- `src/i18n/translations.ts`
- `src/hooks/useTranslation.ts`
- `src/components/LanguageSelector.tsx`
- `src/components/LanguageSwitcher.tsx`

### 4.19 Analytics

Le projet utilise Microsoft Clarity pour le suivi comportemental. Le helper `trackEvent` permet de déclencher des événements comme les clics sur les tarifs ou le démarrage d'une analyse.

Fichiers principaux :

- `src/utils/analytics.ts`
- `index.html`

---

## 5. Parcours utilisateur détaillé

### 5.1 Première analyse de CV

1. L'utilisateur arrive sur la landing page.
2. Il clique sur un CTA pour lancer l'application.
3. S'il n'est pas connecté, Clerk ouvre la connexion ou l'inscription.
4. Après connexion, `/app` affiche le wizard.
5. L'utilisateur charge son CV PDF ou TXT.
6. L'application vérifie qu'il a au moins 1 crédit.
7. Le backend extrait le CV via IA.
8. Le crédit est débité côté serveur lorsque l'action est facturée.
9. L'utilisateur relit et corrige son CV.
10. Il passe à l'étape offre.

### 5.2 Analyse d'une offre

1. L'utilisateur colle une description de poste.
2. L'application vérifie le solde de crédits côté UI.
3. Le backend débite 1 crédit pour l'action `analyze-job`.
4. L'IA renvoie une structure de poste.
5. L'utilisateur valide le résumé.
6. Le wizard passe à l'analyse de correspondance.

### 5.3 Matching et résultats

1. Le front envoie le CV structuré et le poste structuré.
2. Le backend débite 1 crédit pour `optimize-cv`.
3. L'IA calcule le score et génère les recommandations.
4. Les résultats sont stockés dans le store local.
5. L'utilisateur consulte :
   - score ;
   - forces ;
   - axes d'amélioration ;
   - mots-clés manquants ;
   - recommandations ;
   - CV optimisé.
6. Il peut imprimer, télécharger, partager ou inviter un mentor.

### 5.4 Recherche networking

1. L'utilisateur saisit une entreprise, un rôle et éventuellement une localisation.
2. L'IA peut générer des requêtes de recherche adaptées.
3. Serper exécute des recherches Google.
4. Les résultats LinkedIn sont nettoyés, dédupliqués et scorés.
5. L'utilisateur filtre par recruteurs, managers ou employés.
6. Il peut sauvegarder les contacts dans le CRM.
7. Il peut générer une séquence de messages.
8. Il peut exporter les résultats en Excel.

### 5.5 Achat de crédits

1. L'utilisateur ouvre `/pricing`.
2. Il choisit le pack booster ou coach.
3. Le front ouvre Gumroad avec l'ID utilisateur Clerk.
4. Après paiement, Gumroad appelle `gumroad-webhook`.
5. La fonction vérifie le secret webhook.
6. Les crédits sont ajoutés avec `grant_user_credits_once`.
7. Au retour sur l'application, le focus de fenêtre déclenche un refresh du solde.

### 5.6 Rachat d'une licence

1. L'utilisateur saisit une clé licence dans `/pricing`.
2. Le front appelle `redeem-license`.
3. La fonction vérifie le token utilisateur.
4. Elle vérifie la clé auprès de Gumroad.
5. Elle refuse les clés remboursées, chargebackées ou déjà utilisées.
6. Elle crédite le compte et enregistre la clé.

---

## 6. Architecture technique

### 6.1 Vue d'ensemble

```text
Navigateur
  -> React + Vite + TypeScript
  -> Clerk pour l'authentification
  -> Supabase client avec JWT Clerk
  -> Supabase Postgres pour les données
  -> Supabase Edge Functions pour les actions sensibles
  -> APIs externes : Gemini, OpenRouter, Serper, Hunter, Gumroad, Resend
```

### 6.2 Frontend

Stack principale :

- React 19 ;
- TypeScript ;
- Vite 7 ;
- React Router 7 ;
- Zustand ;
- Tailwind CSS 4 ;
- Zod ;
- React Helmet ;
- React PDF ;
- Sonner ;
- Lucide React.

Le front est une SPA. Les routes sont définies dans `src/App.tsx`.

### 6.3 Backend

Le backend métier est composé de Supabase :

- Postgres ;
- Row Level Security ;
- RPC SQL ;
- Edge Functions Deno.

La fonction principale est `career-match-api`. Elle centralise les appels aux services sensibles afin de ne pas exposer les clés API dans le navigateur.

### 6.4 Authentification backend

Les Edge Functions attendent un `Authorization: Bearer <token>`.

Le token vient de Clerk :

```ts
getToken({ template: "supabase" })
```

Les RPC et politiques RLS utilisent `auth.jwt() ->> 'sub'`, qui doit correspondre à l'ID utilisateur Clerk.

### 6.5 État applicatif

Deux stores Zustand structurent l'état :

- `useAppStore` : wizard, CV, offre, résultats, langue, networking, cache section networking ;
- `useUserStore` : solde de crédits, fetch du solde, débit local/RPC, mise à jour du solde.

Le store app est persisté dans `localStorage` sous la clé `career-match-storage`.

---

## 7. Routes de l'application

| Route | Rôle |
|------|------|
| `/` | Landing page |
| `/app` | Wizard principal |
| `/pricing` | Tarifs, achat crédits, rachat licence |
| `/share/:id` | Analyse ou CV partagé |
| `/career/:slug` | Page métier SEO |
| `/blog` | Blog |
| `/blog/:slug` | Article de blog |
| `/about` | Page à propos |
| `/contact` | Contact |
| `/privacy` | Politique de confidentialité |
| `/terms` | Conditions d'utilisation |
| `*` | Redirection vers `/` |

---

## 8. Modèle de données

### 8.1 `profiles`

Stocke le profil applicatif minimal :

- `id` : ID utilisateur Clerk ;
- `credits` : solde de crédits ;
- timestamps selon migration.

Le profil peut être créé automatiquement par `get_user_credits` avec 3 crédits.

### 8.2 `resumes`

Stocke un CV structuré par utilisateur lorsque le flux de sauvegarde est utilisé.

Colonnes principales :

- `user_id` ;
- `content` JSONB ;
- timestamps.

### 8.3 `public_analyses`

Stocke les liens publics :

- `id` UUID ;
- `user_id` ;
- `content` JSONB ;
- `career_slug` ;
- `share_type` ;
- `expires_at` ;
- `revoked_at`.

La lecture publique est permise uniquement si le lien n'est pas révoqué et non expiré.

### 8.4 `domain_patterns`

Cache des patterns e-mail par domaine, utilisé pour l'Email Predictor.

### 8.5 `found_emails`

Cache d'e-mails trouvés, avec informations de domaine et pattern.

### 8.6 `used_licenses`

Empêche la réutilisation d'une clé Gumroad déjà consommée.

### 8.7 `credit_usage_events`

Journalise les débits et crédits importants :

- utilisateur ;
- action ;
- montant ;
- raison ;
- métadonnées.

### 8.8 `credit_grants`

Garantit l'idempotence des ajouts de crédits. Une référence Gumroad, licence ou parrainage ne doit créditer l'utilisateur qu'une seule fois.

### 8.9 `networking_contacts`

Stocke les contacts sauvegardés dans le mini-CRM :

- URL LinkedIn ;
- nom ;
- poste ;
- entreprise ;
- statut ;
- tags ;
- notes ;
- prochaine relance ;
- clé de job.

### 8.10 `networking_message_history`

Stocke les messages générés et copiés pour un contact :

- canal ;
- étape ;
- contenu ;
- date de copie ;
- métadonnées.

### 8.11 `referrals`

Stocke les parrainages :

- parrain ;
- filleul ;
- statut ;
- date de complétion.

---

## 9. Supabase Edge Functions

### 9.1 `career-match-api`

Fonction principale. Elle reçoit une action et un payload.

Actions IA :

- `parse-cv`
- `analyze-job`
- `optimize-cv`
- `generate-networking-queries`
- `generate-networking-message`
- `generate-networking-message-variants`
- `generate-networking-sequence`

Actions recherche :

- `serper-search`
- `serper-batch-search`

Actions Hunter :

- `hunter-domain-search`
- `hunter-email-finder`
- `hunter-email-verifier`

Actions CRM networking :

- `networking-upsert-contact`
- `networking-update-contact`
- `networking-list-contacts`
- `networking-list-messages`
- `networking-insert-message`
- `networking-mark-message-copied`

La fonction vérifie l'utilisateur, débite les crédits des actions payantes, exécute l'action, puis rembourse le crédit si le handler échoue.

### 9.2 `gumroad-webhook`

Reçoit les événements Gumroad après achat.

Elle attend :

- `custom_user_id` ;
- `permalink` ;
- une référence d'achat ;
- un secret webhook configuré.

Elle crédite l'utilisateur via `grant_user_credits_once`.

### 9.3 `redeem-license`

Vérifie une clé licence Gumroad puis crédite l'utilisateur si la clé est valide et non consommée.

### 9.4 `send-email`

Envoie les e-mails transactionnels via Resend :

- bienvenue ;
- match prêt ;
- invitation mentor ;
- autres modèles selon le service front.

### 9.5 `process-referral`

Traite le parrainage après connexion d'un utilisateur.

### 9.6 `sync-resend-contacts`

Synchronise des utilisateurs vers Resend. Cette fonction nécessite une clé Clerk backend et doit être considérée comme une fonction administrative.

---

## 10. Système de crédits

### 10.1 Principe

Les crédits protègent les actions qui ont un coût réel : IA, recherche, Hunter. Le front fait une vérification UX, mais la vérité doit rester côté serveur ou RPC.

### 10.2 Crédit initial

Un nouveau profil reçoit 3 crédits via la RPC `get_user_credits`.

### 10.3 Actions actuellement facturées côté `career-match-api`

| Action | Coût |
|-------|------|
| `parse-cv` | 1 |
| `analyze-job` | 1 |
| `optimize-cv` | 1 |
| `serper-batch-search` | 1 |
| `generate-networking-message` | 1 |
| `generate-networking-message-variants` | 1 |
| `generate-networking-sequence` | 1 |
| `hunter-domain-search` | 1 |
| `hunter-email-finder` | 1 |
| `hunter-email-verifier` | 1 |

Certaines actions ne sont pas facturées directement, par exemple `generate-networking-queries`, les lectures CRM ou les écritures CRM.

### 10.4 Débit

Le débit atomique passe par :

- `decrease_user_credits(p_user_id, p_amount)`.

Cette RPC vérifie :

- que l'utilisateur existe ;
- que le montant est positif ;
- que l'appelant correspond à l'utilisateur, sauf `service_role` ;
- que le solde est suffisant.

### 10.5 Remboursement automatique

Dans `career-match-api`, si une action facturée est débitée puis échoue dans le handler, la fonction tente de rembourser le crédit.

### 10.6 Ajout de crédits

Les ajouts idempotents utilisent :

- `grant_user_credits_once(p_user_id, p_amount, p_source, p_reference, p_meta)`.

Cela évite de créditer deux fois le même achat, la même licence ou le même parrainage.

---

## 11. Services externes

### 11.1 Clerk

Rôle :

- inscription ;
- connexion ;
- session ;
- e-mail utilisateur ;
- JWT pour Supabase.

Configuration indispensable :

- publishable key côté frontend ;
- JWT template `supabase` ;
- URLs autorisées ;
- localisation.

### 11.2 Supabase

Rôle :

- base Postgres ;
- RLS ;
- RPC ;
- Edge Functions ;
- service role pour fonctions serveur.

### 11.3 Google Gemini

Rôle :

- parsing CV ;
- analyse d'offre ;
- matching ;
- génération de textes networking.

La clé doit rester dans les secrets Supabase, pas dans le build frontend.

### 11.4 OpenRouter

Rôle :

- fallback IA optionnel si Gemini échoue ou atteint des limites.

### 11.5 Serper

Rôle :

- recherche Google, notamment LinkedIn, pour le networking.

### 11.6 Hunter

Rôle :

- recherche de domaine ;
- recherche d'e-mail ;
- vérification d'e-mail.

### 11.7 Gumroad

Rôle :

- checkout ;
- webhook ;
- licences.

### 11.8 Resend

Rôle :

- e-mails transactionnels ;
- e-mails de parrainage ;
- synchronisation de contacts si activée.

### 11.9 Microsoft Clarity

Rôle :

- analytics comportemental ;
- événements produit.

---

## 12. Variables et secrets

### 12.1 Variables frontend Vite

| Variable | Rôle |
|---------|------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clé publique Clerk |
| `VITE_SUPABASE_URL` | URL projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase |
| `VITE_ADMIN_EMAILS` | Liste optionnelle d'e-mails admin côté UI |

### 12.2 Secrets Supabase importants

| Secret | Rôle |
|-------|------|
| `SUPABASE_URL` | URL Supabase côté fonctions |
| `SUPABASE_ANON_KEY` | Vérification JWT et client authentifié |
| `SUPABASE_SERVICE_ROLE_KEY` | Accès admin serveur, très sensible |
| `GEMINI_API_KEY` | Appels Gemini |
| `OPENROUTER_API_KEY` | Fallback IA |
| `OPENROUTER_MODEL` | Modèle OpenRouter |
| `SERPER_API_KEY` | Recherche Serper |
| `HUNTER_API_KEY` | Hunter |
| `RESEND_API_KEY` | E-mails |
| `CLERK_SECRET_KEY` | Sync Resend contacts / opérations backend Clerk |
| `GUMROAD_WEBHOOK_SECRET` | Vérification du webhook Gumroad |

---

## 13. Sécurité et confidentialité

### 13.1 Données sensibles

Le produit traite des données très sensibles :

- CV ;
- coordonnées ;
- historique professionnel ;
- compétences ;
- offres ciblées ;
- résultats d'analyse ;
- contacts professionnels trouvés.

Il faut donc être strict sur les accès, les liens publics, les logs et les exports.

### 13.2 RLS Supabase

Les tables utilisateur doivent être protégées par RLS. Les politiques reposent sur l'ID Clerk présent dans le JWT.

Tables sensibles :

- `profiles`
- `resumes`
- `credit_usage_events`
- `credit_grants`
- `networking_contacts`
- `networking_message_history`
- `referrals`
- `used_licenses`

### 13.3 Partage public

`public_analyses` est volontairement lisible publiquement pour les liens valides. Les protections importantes sont :

- UUID non devinable ;
- expiration ;
- révocation ;
- minimisation des coordonnées du CV avant insertion.

### 13.4 Service role

`SUPABASE_SERVICE_ROLE_KEY` ne doit jamais être exposée au front. Elle doit rester uniquement dans les Edge Functions et les scripts administratifs maîtrisés.

### 13.5 Webhook Gumroad

Le webhook doit refuser les appels sans secret valide. Le code actuel vérifie `GUMROAD_WEBHOOK_SECRET` via header ou champ form.

### 13.6 Clés API IA et recherche

Les clés Gemini, OpenRouter, Serper et Hunter doivent être des secrets Supabase. Le front ne doit pas contenir de vraie clé de production.

### 13.7 Bypass admin

`VITE_ADMIN_EMAILS` sert à identifier des comptes admin côté UI. Comme toute variable `VITE_*`, elle est visible dans le bundle client et ne doit pas être considérée comme un secret fort.

Pour un contrôle robuste, préférer un rôle côté serveur.

---

## 14. Structure du dépôt

| Chemin | Rôle |
|-------|------|
| `src/` | Application React |
| `src/components/` | Composants UI et pages |
| `src/components/cv-form/` | Upload et édition du CV |
| `src/components/job-input/` | Saisie et analyse d'offre |
| `src/components/results/` | Résultats, CV optimisé, partage |
| `src/components/networking/` | Recherche contacts, guide, prédiction e-mail |
| `src/components/pages/` | Pages publiques |
| `src/components/share/` | Lecture publique des analyses |
| `src/services/` | Clients Supabase, IA, e-mail, recherche |
| `src/store/` | Stores Zustand |
| `src/types/` | Schémas Zod et types métier |
| `src/i18n/` | Traductions |
| `src/data/` | Blog et pages métiers |
| `supabase/functions/` | Edge Functions |
| `supabase/migrations/` | Schéma SQL, RLS et RPC |
| `public/` | Assets, robots, sitemap |
| `docs/` | Documentation produit et transfert |
| `scripts/` | Scripts de maintenance |

---

## 15. Schémas métier TypeScript

Les types principaux sont dans `src/types/index.ts`.

### 15.1 `ParsedCV`

Représente un CV structuré. Il contient :

- `contact` ;
- `headline` ;
- `summary` ;
- `skills` ;
- `softSkills` ;
- `experience` ;
- `education` ;
- `languages` ;
- `certifications` ;
- `interests`.

### 15.2 `JobAnalysis`

Représente une offre structurée. Il contient :

- `title` ;
- `company` ;
- `description` ;
- `requirements.hardSkills` ;
- `requirements.softSkills` ;
- `requirements.culture` ;
- `requirements.experienceLevel` ;
- `multilingual`.

### 15.3 `MatchResult`

Représente les résultats du matching :

- `score` ;
- `analysis.strengths` ;
- `analysis.weaknesses` ;
- `analysis.missingKeywords` ;
- `analysis.cultureFit` ;
- `optimizedCV` ;
- `analysisLanguage` ;
- `recommendations` ;
- `multilingual`.

---

## 16. Déploiement

### 16.1 Frontend

Le frontend peut être déployé sur Vercel ou tout hébergeur SPA compatible.

Commandes :

```bash
npm install
npm run build
npm run preview
```

La configuration Vercel est dans `vercel.json`.

### 16.2 Supabase

Déployer :

- migrations SQL ;
- Edge Functions ;
- secrets.

Ordre recommandé :

1. créer le projet Supabase ;
2. configurer Clerk et le template JWT ;
3. appliquer les migrations ;
4. renseigner les secrets ;
5. déployer les fonctions ;
6. tester l'auth, les RPC et les actions payantes.

### 16.3 Gumroad

Configurer :

- produits `pack-booster` et `career-coach` ou équivalents ;
- webhook vers `gumroad-webhook`;
- secret webhook ;
- licences si l'offre utilise des codes.

### 16.4 Resend

Configurer :

- clé API ;
- domaine vérifié ;
- expéditeur de production ;
- templates ou contenus utilisés dans la fonction.

---

## 17. Recette fonctionnelle

Après déploiement, tester dans cet ordre :

1. chargement de la landing page ;
2. connexion Clerk ;
3. création ou lecture des crédits ;
4. upload CV PDF ;
5. relecture du CV ;
6. analyse d'offre ;
7. matching ;
8. téléchargement PDF ;
9. création d'un lien public ;
10. ouverture anonyme du lien `/share/:id` ;
11. invitation mentor ;
12. recherche networking ;
13. sauvegarde d'un contact CRM ;
14. génération d'une séquence de message ;
15. prédiction e-mail Hunter ;
16. achat Gumroad test ;
17. webhook créditant le compte ;
18. rachat d'une licence ;
19. expiration/révocation d'un lien public ;
20. absence d'erreurs CSP dans la console navigateur.

---

## 18. Points de maintenance

### 18.1 Politique de crédits

La politique de crédits doit rester lisible pour l'utilisateur et cohérente entre :

- tarifs ;
- UI ;
- `BILLABLE_ACTION_COSTS` ;
- RPC ;
- docs.

Toute nouvelle action coûteuse doit être ajoutée explicitement.

### 18.2 Données publiques

Surveiller `public_analyses`, car cette table peut contenir des résultats liés à un CV. Même si les coordonnées sont retirées, le contenu peut rester personnel.

### 18.3 CORS

Plusieurs fonctions utilisent encore des headers CORS larges. Pour une production stricte, resserrer les origines autorisées.

### 18.4 Logs

Éviter de logger des CV, clés, e-mails complets, licences ou réponses IA sensibles.

### 18.5 Produits Gumroad

Si les produits Gumroad changent, mettre à jour :

- slugs dans `PricingPage.tsx` ;
- mapping webhook ;
- product IDs dans `redeem-license`.

### 18.6 Domaine et marque

En cas de changement de domaine, vérifier :

- SEO ;
- sitemap ;
- robots ;
- canonical ;
- e-mails ;
- CSP ;
- Gumroad ;
- Resend ;
- Clerk ;
- pages légales.

---

## 19. Limites connues et risques

### 19.1 Dépendance IA

Le coeur du produit dépend de réponses IA fiables. Il faut gérer :

- erreurs JSON ;
- quotas ;
- timeouts ;
- réponses partielles ;
- drift de modèle.

Le code inclut des retries et un fallback OpenRouter possible.

### 19.2 Qualité du parsing CV

Un CV mal formaté, scanné ou très graphique peut produire une extraction imparfaite. L'écran de relecture est donc essentiel.

### 19.3 Exactitude du score

Le score est une aide à la décision, pas une vérité absolue. Il dépend de l'offre, du CV et du modèle.

### 19.4 Networking

Les résultats Serper et LinkedIn peuvent être incomplets, obsolètes ou bruités. Le scoring améliore la lisibilité mais ne garantit pas que chaque contact est correct.

### 19.5 E-mails professionnels

Hunter et les patterns e-mail peuvent proposer des adresses incertaines. Les scores de confiance et vérifications doivent être affichés avec prudence.

### 19.6 Conformité RGPD

Le projet manipule des données personnelles. Il faut maintenir :

- politique de confidentialité claire ;
- droit de suppression ;
- minimisation des liens publics ;
- durée de conservation ;
- accès aux données limité.

---

## 20. Glossaire

**ATS** : Applicant Tracking System, logiciel utilisé par les recruteurs pour filtrer les candidatures.

**Clerk** : service d'authentification utilisé par l'application.

**Crédit** : unité consommée pour les actions payantes.

**Edge Function** : fonction serveur Supabase exécutée côté backend.

**Gemini** : modèle IA principal utilisé pour les analyses.

**Hunter** : service de recherche et vérification d'e-mails professionnels.

**OpenRouter** : passerelle de modèles IA utilisée comme fallback.

**RLS** : Row Level Security, mécanisme Supabase/Postgres qui limite les lignes accessibles selon l'utilisateur.

**Serper** : API de recherche Google utilisée pour le networking.

**Zustand** : librairie de state management utilisée côté React.

---

## 21. Lecture recommandée dans `docs`

Pour comprendre le produit :

- `docs/CAREER_MATCH.md`
- `docs/PRD.md`

Pour transférer, déployer ou céder le projet :

- `docs/GUIDE_CESSION.md`

Pour une vue rapide de la documentation :

- `docs/README.md`

---

*Ce document décrit l'application à partir de l'état actuel du dépôt. Il doit être mis à jour à chaque évolution majeure du produit, du modèle de crédits, des fonctions Supabase ou des services externes.*
