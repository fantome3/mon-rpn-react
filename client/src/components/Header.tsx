import { Link, useNavigate } from 'react-router-dom'
import { ModeToggle } from './languageToggle'
import MobileMenu from './MobileMenu'
import { menuItemsConnected } from '@/lib/constant'
import { useContext } from 'react'
import { Store } from '@/lib/Store'
import { Button } from './ui/button'
import clsx from 'clsx'
import AdminMenu from './AdminMenu'

const Navbar = () => {
  const { state, dispatch: ctxDispatch } = useContext(Store)
  const { userInfo } = state
  const navigate = useNavigate()
  const logoutHandler = () => {
    ctxDispatch({ type: 'USER_SIGNOUT' })
    ctxDispatch({ type: 'CLEAR_ACCOUNT' })
    localStorage.removeItem('userInfo')
    localStorage.removeItem('accountInfo')
    navigate('/login')
  }

  const pathname = location.pathname

  return (
    <div
      className={
        userInfo
          ? 'bg-primary text-white p-4 flex items-center justify-between'
          : 'bg-white border-2 border-primary text-zinc-950 p-4 flex items-center justify-between'
      }
    >
      <aside className='flex items-center gap-2'>
        <Link to='/'>
          <span className='text-xl font-bold'>MONRPN</span>
        </Link>
      </aside>
      <nav className='hidden lg:block absolute left-[15%]'>
        <ul className='flex items-center justify-center gap-8'>
          {menuItemsConnected.map((item) => (
            <Link
              className={clsx('', {
                'font-bold text-lg': pathname === item.link,
              })}
              key={item.name}
              to={item.link}
            >
              {item.name}
            </Link>
          ))}
        </ul>
      </nav>
      <aside className=' items-center flex lg:flex gap-2'>
        {userInfo && userInfo.isAdmin ? <AdminMenu /> : ''}
        {userInfo ? (
          <>
            <Button
              className='text-destructive hover:text-destructive/90 hidden lg:flex'
              variant='outline'
              onClick={() => logoutHandler()}
            >
              Déconnexion
            </Button>
          </>
        ) : (
          <>
            <Link
              className={clsx('hover:text-secondary hidden lg:flex', {
                'hover:text-slate-700': !userInfo,
              })}
              to={'/login'}
            >
              Connexion
            </Link>
            <Link
              to={'/register'}
              className={clsx(
                'p-2 px-4 rounded-md hover:text-secondary hidden lg:flex',
                {
                  'hover:text-slate-700': !userInfo,
                }
              )}
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
