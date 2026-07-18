-- Index composite pour accélérer la recherche dans le cache found_emails
-- Utilisé à chaque appel getCachedEmail(firstName, lastName, domain)
CREATE INDEX IF NOT EXISTS found_emails_name_domain_idx
  ON public.found_emails(first_name, last_name, domain);

-- Index pour domain_patterns (déjà primary key sur domain, mais on s'assure)
CREATE INDEX IF NOT EXISTS domain_patterns_domain_idx
  ON public.domain_patterns(domain);

-- Politique : les utilisateurs authentifiés peuvent lire le cache global
-- (déjà en place via harden_email_cache_rls, on s'assure de l'insert côté service)
-- Les inserts restent réservés au service role (career-match-api edge function)
