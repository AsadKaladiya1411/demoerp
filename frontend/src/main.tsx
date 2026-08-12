import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErpProvider } from './context/ErpContext.tsx'
import { AuthProvider } from './context/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ErpProvider>
        <App />
      </ErpProvider>
    </AuthProvider>
  </StrictMode>,
)
