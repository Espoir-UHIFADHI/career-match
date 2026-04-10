# Scripts

## Outils de prod / maintenance (TypeScript)

À lancer avec `npx tsx` ou après compilation selon votre setup :

| Fichier | Rôle |
|---------|------|
| `add_credits_to_user.ts` | Ajuster les crédits d’un utilisateur |
| `check_credits.ts` | Vérifier le solde |
| `sync-users_local.ts` | Sync utilisateurs |
| `verify-resend.ts` | Tester Resend |
| `generate-sitemap.js` | Régénère `public/sitemap.xml` depuis `src/data/seo-careers.json` |
| `test-webhook-prod.js` | Test manuel webhook Gumroad (**éditer `PROJECT_REF` et données de test**) |

## Scripts de développement / diagnostic (`dev/`)

**Toujours exécuter depuis la racine du dépôt** (là où se trouve le `.env`).

| Fichier | Commande | Prérequis |
|---------|----------|-----------|
| `dev/diagnose-gemini.mjs` | `node scripts/dev/diagnose-gemini.mjs` | `VITE_GEMINI_API_KEY` ou `GEMINI_API_KEY` dans `.env` |
| `dev/check-models.mjs` | `node scripts/dev/check-models.mjs` | idem ; écrit dans `dev/_output/models_output.txt` |
| `dev/test-serper.mjs` | `node scripts/dev/test-serper.mjs` | `VITE_SERPER_API_KEY` ou `SERPER_API_KEY` |
| `dev/test-serper-api.mjs` | `node scripts/dev/test-serper-api.mjs` | idem |
| `dev/test-serper-api.cjs` | `node scripts/dev/test-serper-api.cjs` | idem |
| `dev/test-networking.cjs` | `node scripts/dev/test-networking.cjs` | idem |
| `dev/test-supabase.mjs` | `node scripts/dev/test-supabase.mjs` | — |
| `dev/test_email.mjs` | `node scripts/dev/test_email.mjs` | — |
| `dev/test_clean_name.mjs` | `node scripts/dev/test_clean_name.mjs` | — |
| `dev/calc_hash.cjs` | `node scripts/dev/calc_hash.cjs` | — (hash script Clarity) |

Utilitaire partagé : `dev/_lib/read-root-env.mjs` (lecture du `.env` racine).
