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
  ForgotPassword,
  ResetPassword,
  About,
  Contact,
  Dependents,
  Sponsorship,
  Page404,
  PaymentMethod,
  Accounts,
  Announcements,
  UpdateMethod,
  Conditions,
  Transactions,
  TransactionsByUserId,
  AllAnnouncements,
  AccountDeactivated,
} from './pages/index.ts'
import './lib/i18n'
import { StoreProvider } from './lib/Store.tsx'
import { Toaster } from './components/ui/toaster.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import UserHomPage from './components/UserHomePage.tsx'
import AdminRoute from './components/AdminRoute.tsx'
import { HelmetProvider } from 'react-helmet-async'

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path='*' element={<Page404 />} />
      <Route path='/login' element={<Login />} />
      <Route path='/forgot-password' element={<ForgotPassword />} />
      <Route path='/reset-password/:id/:token' element={<ResetPassword />} />
      <Route path='/register' element={<Register />} />
      <Route path='/register/:id/:ref' element={<Register />} />
      <Route path='/origines' element={<Origines />} />
      <Route path='/infos' element={<Infos />} />
      <Route path='/about' element={<About />} />
      <Route path='/contact-us' element={<Contact />} />
      <Route path='/conditions' element={<Conditions />} />
      <Route path='/account-deactivated' element={<AccountDeactivated />} />
      <Route path='/' element={<App />}>
        <Route path='/' index={true} element={<HomePage />} />

        {/**Auth Users */}
        <Route path='' element={<ProtectedRoute />}>
          <Route path='/profil' element={<Profil />} />
          <Route path='/summary' element={<UserHomPage />} />
          <Route path='/dependents' element={<Dependents />} />
          <Route path='/sponsorship' element={<Sponsorship />} />
          <Route path='/payment-method' element={<PaymentMethod />} />
          <Route path='/change-method' element={<UpdateMethod />} />
          <Route
            path='/transactions/:id/all'
            element={<TransactionsByUserId />}
          />
          <Route path='/announcements' element={<AllAnnouncements />} />
        </Route>

        {/**Admin Users */}
        <Route path='/admin' element={<AdminRoute />}>
          <Route path='accounts' element={<Accounts />} />
          <Route path='announcements' element={<Announcements />} />
          <Route path='transactions' element={<Transactions />} />
        </Route>
      </Route>
    </>
  )
)

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <React.StrictMode>
      <StoreProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
      <Toaster />
    </StoreProvider>
  </React.StrictMode>
</HelmetProvider>
)
