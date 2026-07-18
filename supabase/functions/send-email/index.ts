import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  type: "welcome" | "match_ready" | "invite_mentor" | "reengage_low_score" | "reengage_high_score";
  data?: any;
}

async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) throw new Error("Missing bearer token");

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Missing Supabase auth config");

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.id) throw new Error("Invalid or expired bearer token");
  return data.user;
}

function getUserPrimaryEmail(user: any): string {
  return user.email || user.user_metadata?.email || "";
}

const getEmailLayout = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; width: 100%; -webkit-text-size-adjust: 100%; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .header { background-color: #ffffff; padding: 32px; text-align: center; border-bottom: 1px solid #f3f4f6; }
    .logo { font-size: 24px; font-weight: 800; color: #4f46e5; text-decoration: none; letter-spacing: -0.5px; }
    .content { padding: 40px 32px; color: #374151; line-height: 1.6; font-size: 16px; }
    .button { display: inline-block; background-color: #4f46e5; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 600; margin-top: 24px; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.1), 0 2px 4px -1px rgba(79, 70, 229, 0.06); transition: background-color 0.2s; }
    .button:hover { background-color: #4338ca; }
    .footer { background-color: #f9fafb; padding: 32px; text-align: center; font-size: 13px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
    h1 { color: #111827; font-size: 24px; margin-top: 0; margin-bottom: 24px; font-weight: 700; letter-spacing: -0.025em; }
    p { margin-bottom: 16px; }
    ul { padding-left: 20px; margin-bottom: 24px; }
    li { margin-bottom: 12px; color: #4b5563; }
    .highlight-box { background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center; }
    .score-label { margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #5b21b6; font-weight: 600; }
    .score-value { margin: 8px 0 0 0; font-size: 56px; font-weight: 800; color: #4f46e5; line-height: 1; }
    .footer-link { color: #6b7280; text-decoration: none; margin: 0 8px; }
    .footer-link:hover { color: #4f46e5; }
    @media only screen and (max-width: 600px) {
      .container { margin: 0; border-radius: 0; }
      .content { padding: 24px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="https://careermatch.fr" style="text-decoration: none;">
        <img src="https://careermatch.fr/career-match.png" alt="Career Match" height="40" style="height: 40px; border: 0; line-height: 100%; outline: none; text-decoration: none; display: inline-block;">
      </a>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p style="margin-bottom: 16px;">© 2025 Career Match. Tous droits réservés.</p>
      <p style="margin: 0;">
        <a href="https://careermatch.fr" class="footer-link">Visiter le site</a> • 
        <a href="mailto:contact@careermatch.fr" class="footer-link">Nous contacter</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

const EMAIL_TEMPLATES = {
  welcome: (data: any) => ({
    subject: "Bienvenue sur Career Match",
    html: getEmailLayout(`
      <h1>Bienvenue ${data?.name ? data.name : ''} !</h1>
      <p>Merci de nous avoir rejoints.</p>
      <p>Voici comment Career Match va vous aider concrètement dans votre recherche :</p>
      <ul>
        <li><strong>Optimiser votre CV</strong> pour qu'il passe les filtres des recruteurs</li>
        <li><strong>Trouver l'email direct</strong> de n'importe quel décideur</li>
        <li><strong>Obtenir des analyses</strong> pour améliorer vos candidatures</li>
      </ul>
      <p>Hâte de voir vos premiers résultats.</p>
      <div style="text-align: center;">
        <a href="https://careermatch.fr" class="button">Commencer maintenant</a>
      </div>
    `),
  }),
  match_ready: (data: any) => ({
    subject: "Votre analyse CV est prête ! 📄",
    html: getEmailLayout(`
      <h1>Analyse Terminée ! ✅</h1>
      <p>Bonne nouvelle ! Notre IA a terminé l'analyse de votre CV pour le poste de <strong>${data?.jobTitle || 'Cible'}</strong>.</p>
      
      <div class="highlight-box">
        <p class="score-label">Votre Score de Compatibilité</p>
        <p class="score-value">${data?.score}%</p>
      </div>

      <p>Découvrez dès maintenant vos points forts et, surtout, les mots-clés qui vous manquent pour décrocher l'entretien.</p>
      <div style="text-align: center;">
        <a href="https://careermatch.fr" class="button">Voir mon rapport détaillé</a>
      </div>
    `),
  }),
  reengage_low_score: (data: any) => ({
    subject: `Votre CV a encore du potentiel — 3 corrections prioritaires`,
    html: getEmailLayout(`
      <h1>Votre score de ${data?.score}% peut être amélioré 💪</h1>
      <p>Bonjour ${data?.name || ''},</p>
      <p>Vous avez analysé votre CV pour un poste de <strong>${data?.jobTitle || 'votre poste cible'}</strong> il y a quelques jours. Avec un score de <strong>${data?.score}%</strong>, vous êtes proche — mais les filtres ATS vous éliminent encore avant d'atteindre un recruteur.</p>

      <div class="highlight-box">
        <p class="score-label">Votre Score Actuel</p>
        <p class="score-value" style="color: #dc2626;">${data?.score}%</p>
        <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Objectif : dépasser 75% pour passer les filtres</p>
      </div>

      <p><strong>Les 3 erreurs les plus fréquentes à ce niveau :</strong></p>
      <ul>
        <li><strong>Mots-clés manquants</strong> — L'ATS cherche des termes spécifiques au poste. Si votre CV n'en contient pas, il est rejeté automatiquement.</li>
        <li><strong>Mise en page complexe</strong> — Colonnes, tableaux ou infographies brisent le parsing ATS.</li>
        <li><strong>Section compétences absente ou trop vague</strong> — C'est là que les robots cherchent en priorité.</li>
      </ul>

      <p>Revenez sur Career Match, collez une nouvelle offre d'emploi — notre IA refera l'analyse et optimisera votre CV en quelques secondes.</p>

      <div style="text-align: center;">
        <a href="https://careermatch.fr/app" class="button">Optimiser mon CV maintenant</a>
      </div>
    `),
  }),

  reengage_high_score: (data: any) => ({
    subject: `Vous êtes prêt à postuler — voici comment maximiser vos chances 🚀`,
    html: getEmailLayout(`
      <h1>Score ${data?.score}% — Vous passez les filtres ! ✅</h1>
      <p>Bonjour ${data?.name || ''},</p>
      <p>Votre CV pour le poste de <strong>${data?.jobTitle || 'votre poste cible'}</strong> est optimisé. Avec un score de <strong>${data?.score}%</strong>, vous passez la majorité des filtres ATS.</p>

      <div class="highlight-box">
        <p class="score-label">Votre Score</p>
        <p class="score-value" style="color: #059669;">${data?.score}%</p>
        <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Excellent — votre profil correspond aux attentes</p>
      </div>

      <p><strong>La prochaine étape : le contact humain.</strong></p>
      <p>Un bon CV est nécessaire, mais le vrai levier pour décrocher un entretien, c'est le réseau. 80% des postes sont pourvus par cooptation.</p>

      <ul>
        <li>Identifiez 2-3 personnes qui travaillent déjà dans cette entreprise</li>
        <li>Utilisez l'outil <strong>Networking</strong> de Career Match pour trouver leurs emails</li>
        <li>Envoyez un message court et personnalisé — pas un copier-coller</li>
      </ul>

      <div style="text-align: center;">
        <a href="https://careermatch.fr/app" class="button">Accéder au module Networking</a>
      </div>
    `),
  }),

  invite_mentor: (data: any) => ({
    subject: `${data?.menteeName || 'Un contact'} sollicite votre avis d'expert 🤝`,
    html: getEmailLayout(`
      <h1>Demande de Feedback 💬</h1>
      <p>Bonjour,</p>
      <p><strong>${data?.menteeName || 'Un utilisateur de Career Match'}</strong> vient d'analyser son CV pour un poste de <strong>${data?.jobTitle || 'Cible'}</strong> et souhaiterait vous partager son cv.</p>
      
      <div class="highlight-box">
        <p class="score-label">Score de Compatibilité Actuel</p>
        <p class="score-value">${data?.score}%</p>
      </div>

      <p>"${data?.message || "Je travaille sur mon CV pour ce poste, qu'en penses-tu ?"}"</p>
      
      <div style="text-align: center;">
        <a href="${data?.link}" class="button">Voir l'analyse et conseiller</a>
      </div>
      <p style="margin-top: 24px; font-size: 14px; text-align: center; color: #6b7280;">
        Vous recevez cet email car vous avez été invité à collaborer. Pas d'inscription requise.
      </p>
    `),
  }),
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const user = await getAuthenticatedUser(req);
    const { to, type, data } = await req.json();

    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    if (!to || !type) {
      throw new Error("Missing 'to' or 'type' in request body");
    }

    const userEmail = getUserPrimaryEmail(user);
    if (type !== "invite_mentor" && userEmail && to.toLowerCase() !== userEmail.toLowerCase()) {
      throw new Error("Cannot send this email type to another user");
    }

    const templateGenerator = EMAIL_TEMPLATES[type];
    if (!templateGenerator) {
      throw new Error(`Invalid email type: ${type}`);
    }

    const { subject, html } = templateGenerator(data);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Career Match <onboarding@resend.dev>",
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const responseData = await res.json();

    if (!res.ok) {
      console.error("Resend API Error:", responseData);
      throw new Error(`Resend API Error: ${JSON.stringify(responseData)}`);
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
