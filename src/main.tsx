import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import ProjectPage from './pages/ProjectPage.tsx'
import { LangProvider } from './i18n.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/projects/:slug" element={<ProjectPage />} />
        </Routes>
      </BrowserRouter>
    </LangProvider>
  </StrictMode>,
)
