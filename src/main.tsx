import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'


import { frFR } from '@clerk/localizations'

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const localization = {
  ...frFR,
  formFieldLabel__optional: '',
  formFieldLabel__username: "Nom d'utilisateur (lettres, chiffres, - ou _)",
}

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

console.log("main.tsx running");
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider localization={localization} publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </StrictMode>,
)
