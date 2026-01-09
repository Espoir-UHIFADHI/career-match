import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { Providers } from './components/Providers.tsx';

console.log("main.tsx running");
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <Providers>
        <App />
      </Providers>
    </GlobalErrorBoundary>
  </StrictMode>,
)
