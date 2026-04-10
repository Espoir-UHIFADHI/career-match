# Améliorations & dette technique

## Déjà en place (ne plus traiter comme « à faire »)

- Les appels **Gemini**, **Serper** et **Hunter** passent par l’Edge Function **`career-match-api`** ; les clés correspondantes sont des **secrets Supabase**, pas des `VITE_*` exposées au navigateur pour ces flux.

## Pistes utiles

- Durcir la **validation du webhook Gumroad** (signature).
- Restreindre les politiques **RLS** sur `public_analyses` si besoin RGPD.
- Table **`referrals`** : versionner le SQL si le parrainage est utilisé (voir `docs/GUIDE_CESSION.md`).
- Bypass crédits : configurable via **`VITE_ADMIN_EMAILS`** (liste séparée par des virgules) ; défaut historique si la variable est absente. Pour la prod stricte : définir explicitement les e-mails autorisés (ou `VITE_ADMIN_EMAILS=` vide pour désactiver le bypass). Rôle Clerk / flag base : optionnel plus tard.
