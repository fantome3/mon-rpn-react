import { Button } from './ui/button'
import { Menu } from 'lucide-react'
import { Sheet, SheetClose, SheetContent, SheetTrigger } from './ui/sheet'
import { Link } from 'react-router-dom'
import { Separator } from './ui/separator'
import { menuItemsConnected, menuItemsDisconnected } from '@/lib/constant'
import clsx from 'clsx'
import { useContext } from 'react'
import { Store } from '@/lib/Store'

const MobileMenu = ({ logoutHandler }: { logoutHandler: () => void }) => {
  const { state } = useContext(Store)
  const { userInfo } = state

  const pathname = location.pathname

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className={clsx('lg:hidden', {
            ' text-black bg-transparent hover:bg-slate-100': !userInfo,
          })}
          size='icon'
          variant='default'
        >
          <Menu className='h-7 w-7' />
          <span className='sr-only'>Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className='py-10'>
          <ul className='flex flex-col gap-y-7'>
            {userInfo
              ? menuItemsConnected.map((item) => (
                  <div
                    className={clsx('', {
                      ' text-primary font-bold text-lg': pathname === item.link,
                    })}
                    key={item.name}
                  >
                    <div className='mb-4'>
                      <SheetClose asChild>
                        <Link to={item.link}>{item.name}</Link>
                      </SheetClose>
                    </div>

                    <Separator />
                  </div>
                ))
              : menuItemsDisconnected.map((item) => (
                  <div
                    className={clsx('', {
                      ' text-primary font-bold text-lg': pathname === item.link,
                    })}
                    key={item.name}
                  >
                    <SheetClose asChild>
                      <div className='mb-4'>
                        <Link to={item.link}>{item.name}</Link>
                      </div>
                    </SheetClose>

                    <Separator />
                  </div>
                ))}
          </ul>
        </div>
        {!userInfo ? (
          ''
        ) : (
          <SheetClose asChild>
            <div
              onClick={() => logoutHandler()}
              className='text-destructive cursor-pointer'
            >
              Déconnexion
            </div>
          </SheetClose>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default MobileMenu
