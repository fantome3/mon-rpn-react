import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom'
import {
  HomePage,
  Origines,
  Login,
  Register,
  Infos,
  Profil,
} from './pages/index.ts'
import './lib/i18n'
import { StoreProvider } from './lib/Store.tsx'
import { Toaster } from './components/ui/toaster.tsx'

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path='/login' element={<Login />} />
      <Route path='/register' element={<Register />} />
      <Route path='/origines' element={<Origines />} />
      <Route path='/infos' element={<Infos />} />

      <Route path='/' element={<App />}>
        <Route path='/' index={true} element={<HomePage />} />
        <Route path='/profil' element={<Profil />} />
      </Route>
    </>
  )
)

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
      <Toaster />
    </StoreProvider>
  </React.StrictMode>
)
