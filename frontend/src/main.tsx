import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // <--- Importăm aici Router-ul
import './index.css'
import App from './App.tsx' // (sau .jsx, depinde cum l-ai numit, VS Code îl găsește)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter> {/* <--- Îl punem AICI, să învelească toată aplicația */}
      <App />
    </BrowserRouter>
  </StrictMode>,
)