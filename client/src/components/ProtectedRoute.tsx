import { Store } from '@/lib/Store'
import { useContext, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Announcement from './Announcement'
import { useGetAccountsByUserIdQuery } from '@/hooks/accountHooks'
import useAwaitingFirstPaymentRedirect from '@/hooks/useAwaitingFirstPaymentRedirect'

const ProtectedRoute = () => {
  const {
    state: { userInfo, accountInfo },
    dispatch: ctxDispatch,
  } = useContext(Store)

  const { data: accounts } = useGetAccountsByUserIdQuery(userInfo?._id)
  const fetchedAccount = accounts?.[accounts.length - 1]

  useAwaitingFirstPaymentRedirect(accountInfo)

  useEffect(() => {
    if (fetchedAccount) {
      ctxDispatch({ type: 'ACCOUNT_INFOS', payload: fetchedAccount })
      localStorage.setItem('accountInfo', JSON.stringify(fetchedAccount))
    }
  }, [fetchedAccount, ctxDispatch])

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
