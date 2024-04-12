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
  if (userInfo) {
    return (
      <>
        <Announcement />
        <Header />
        <Outlet />
        <Footer />
      </>
    )
  } else {
    return <Navigate to='/login' />
  }
}

export default ProtectedRoute
