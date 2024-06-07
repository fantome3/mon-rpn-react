import { useContext } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Store } from '@/lib/Store'
import Announcement from './Announcement'
import Header from './Header'
import Footer from './Footer'

const AdminRoute = () => {
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
    return <Navigate to='/login' />
  }
}

export default AdminRoute
