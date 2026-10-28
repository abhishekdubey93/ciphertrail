import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './globals.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('CipherTrail could not find the root element.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
