import { useContext } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Store } from '@/lib/Store'
import Announcement from './Announcement'
import Header from './Header'
import Footer from './Footer'

const AdminRoute = () => {
  const location = useLocation()
  const {
    state: { userInfo },
  } = useContext(Store)
  if (userInfo && userInfo.isAdmin) {
    return (
      <>
        <Announcement />
        <Header />
        <Outlet />
        <Footer />
      </>
    )
  } else {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }
}

export default AdminRoute
