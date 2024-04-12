import SimpleHomePage from '@/components/SimpleHomePage'
import UserHomePage from '@/components/UserHomePage'
import { Store } from '@/lib/Store'
import { useContext } from 'react'

const HomePage = () => {
  const { state } = useContext(Store)
  const { userInfo } = state
  return <div>{userInfo ? <UserHomePage /> : <SimpleHomePage />}</div>
}

export default HomePage
