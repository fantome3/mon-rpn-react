import { Link, useNavigate } from 'react-router-dom'
import { ModeToggle } from './languageToggle'
import MobileMenu from './MobileMenu'
import { menuItems } from '@/lib/constant'
import { useContext } from 'react'
import { Store } from '@/lib/Store'
import { Button } from './ui/button'

const Navbar = () => {
  const { state, dispatch: ctxDispatch } = useContext(Store)
  const { userInfo } = state
  const navigate = useNavigate()
  const logoutHandler = () => {
    ctxDispatch({ type: 'USER_SIGNOUT' })
    localStorage.removeItem('userInfo')
    navigate('/login')
  }
  return (
    <div className='bg-primary text-white p-4 flex items-center justify-between'>
      <aside className='flex items-center gap-2'>
        <Link to='/'>
          <span className='text-xl font-bold'>MONRPN</span>
        </Link>
      </aside>
      <nav className='hidden md:block absolute left-[15%]  '>
        <ul className='flex items-center justify-center gap-8'>
          {menuItems.map((item) => (
            <Link key={item.name} to={item.link}>
              {item.name}
            </Link>
          ))}
        </ul>
      </nav>
      <aside className=' items-center flex md:flex gap-2'>
        {userInfo ? (
          <Button
            className='text-destructive hover:text-destructive/90 hidden md:flex'
            variant='outline'
            onClick={() => logoutHandler()}
          >
            Déconnexion
          </Button>
        ) : (
          <>
            <Link className='hover:text-secondary hidden md:flex' to={'/login'}>
              Connexion
            </Link>
            <Link
              to={'/register'}
              className='p-2 px-4 rounded-md hover:text-secondary hidden md:flex'
            >
              S'incrire
            </Link>
          </>
        )}

        <ModeToggle />
        <MobileMenu logoutHandler={logoutHandler} />
      </aside>
    </div>
  )
}

export default Navbar
