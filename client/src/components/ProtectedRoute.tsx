import { Store } from '@/lib/Store'
import { useContext } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Announcement from './Announcement'

const ProtectedRoute = () => {
  const {
    state: { userInfo },
  } = useContext(Store)

  if (!userInfo) return <Navigate to='/login' />
  if (userInfo?.subscription?.status === 'inactive') {
    return <Navigate to='/account-deactivated' />
  }

  return (
    <>
      <Announcement />
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}

export default ProtectedRoute
