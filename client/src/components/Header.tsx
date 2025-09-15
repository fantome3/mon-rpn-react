import { Link, useNavigate } from 'react-router-dom'
import MobileMenu from './MobileMenu'
import { menuItemsConnected } from '@/lib/constant'
import { useContext } from 'react'
import { Store } from '@/lib/Store'
import { Button } from './ui/button'
import clsx from 'clsx'
import AdminMenu from './AdminMenu'
import logoAcq from '@/assets/logo-Acq-jpeg.jpg'

const Navbar = () => {
  const { state, logoutHandler } = useContext(Store)
  const { userInfo } = state
  const navigate = useNavigate()
  const pathname = location.pathname

  return (
    <div
      className={
        userInfo && userInfo.infos
          ? 'bg-primary text-white p-4 flex items-center justify-between'
          : 'bg-white border-primary text-zinc-950 p-4 flex items-center justify-between'
      }
    >
      <aside className='flex flex-col items-center gap-1'>
        <Link to='/' className='flex flex-col items-center gap-1 group'>
          <div className='relative overflow-hidden rounded-full border-2 border-white/20 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl'>
            <img
              src={logoAcq}
              alt='Association des Camerounais du Québec'
              className='md:w-16 md:h-16 object-cover transition-transform duration-300 group-hover:scale-110'
            />
          </div>
          <span className='text-xs font-bold'>
            ACQ-RPN
          </span>
        </Link>
      </aside>
      <nav className='hidden lg:block absolute left-[15%]'>
        <ul className='flex items-center justify-center gap-8'>
          {userInfo?.infos &&
            menuItemsConnected.map((item) => (
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
        {userInfo && userInfo.infos ? (
          <>
            <Button
              className='text-destructive hover:text-destructive/90 hidden lg:flex'
              variant='outline'
              onClick={() => {
                logoutHandler()
                navigate('/login')
              }}
            >
              Déconnexion
            </Button>
          </>
        ) : (
          <>
            <Link
              className={clsx('hover:text-secondary hidden lg:flex px-3 py-1 rounded-md transition-colors duration-200', {
                'hover:text-slate-700': !userInfo,
                'bg-slate-100 text-slate-800 font-medium': pathname === '/about' && !userInfo,
              })}
              to={'/about'}
            >
              À propos de nous
            </Link>
            <Link
              className={clsx('hover:text-secondary hidden lg:flex px-3 py-1 rounded-md', {
                'hover:text-slate-700': !userInfo,
              })}
              to={'/login'}
            >
              Connexion
            </Link>
            <Link
              to={'/register'}
              className={clsx(
                'px-3 py-1 rounded-md hover:text-secondary hidden lg:flex',
                {
                  'hover:text-slate-700': !userInfo,
                }
              )}
            >
              S'incrire
            </Link>
          </>
        )}
        {/*   <ModeToggle />*/}
        <MobileMenu />
      </aside>
    </div>
  )
}

export default Navbar
