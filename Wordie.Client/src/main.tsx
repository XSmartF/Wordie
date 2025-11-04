import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './index.css'
import { Toaster } from '@/shared/components/ui/sonner'
import { AppProviders } from '@/shared/providers/app-providers'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </AppProviders>
  </StrictMode>,
)
