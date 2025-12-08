import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  type: "welcome" | "match_ready";
  data?: any;
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
        <img src="https://careermatch.fr/logo.png" alt="Career Match" height="40" style="height: 40px; border: 0; line-height: 100%; outline: none; text-decoration: none; display: inline-block;">
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
    subject: "Bienvenue sur Career Match ! 🚀",
    html: getEmailLayout(`
      <h1>Bienvenue, ${data?.name || 'cher utilisateur'} ! 👋</h1>
      <p>Merci de nous avoir rejoints. Nous sommes ravis de vous aider à propulser votre carrière vers de nouveaux sommets.</p>
      <p>Avec <strong>Career Match</strong>, vous avez désormais le pouvoir de :</p>
      <ul>
        <li>⚡ <strong>Optimiser</strong> votre CV pour battre les ATS</li>
        <li>🎯 <strong>Trouver</strong> les emails directs des recruteurs et patrons</li>
        <li>📈 <strong>Recevoir</strong> des analyses détaillées et personnalisées</li>
      </ul>
      <p>Prêt à décrocher le job de vos rêves ?</p>
      <div style="text-align: center;">
        <a href="https://careermatch.fr" class="button">Accéder à mon tableau de bord</a>
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
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, type, data } = await req.json();

    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    if (!to || !type) {
      throw new Error("Missing 'to' or 'type' in request body");
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
        from: "Career Match <contact@careermatch.fr>",
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
