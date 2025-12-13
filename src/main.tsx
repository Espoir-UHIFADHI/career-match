import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';


import { frFR } from '@clerk/localizations'

// Import your publishable key
// Import your publishable key
let PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Sanitize the key: remove quotes if the user accidentally included them in Vercel env vars
if (PUBLISHABLE_KEY) {
  PUBLISHABLE_KEY = PUBLISHABLE_KEY.trim().replace(/^"|"$/g, '');
}

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

// Validation check associated to console for easier debugging in production
if (!PUBLISHABLE_KEY.startsWith("pk_")) {
  console.error("Config Error: Clerk Publishable Key does not start with 'pk_'. Check your .env or Vercel Environment Variables.");
} else {
  console.log("Clerk Key loaded successfully (" + PUBLISHABLE_KEY.substring(0, 8) + "...)");
}

const localization = {
  ...frFR,
  formFieldLabel__optional: '',
  formFieldLabel__username: "Nom d'utilisateur (lettres, chiffres, - ou _)",
}

console.log("main.tsx running");
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <ClerkProvider localization={localization} publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    </GlobalErrorBoundary>
  </StrictMode>,
)
