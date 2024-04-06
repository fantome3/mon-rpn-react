import { Button } from './ui/button'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import { Link } from 'react-router-dom'
import { Separator } from './ui/separator'
import { menuItems } from '@/lib/constant'

const MobileMenu = ({ logoutHandler }: { logoutHandler: () => void }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className=' md:hidden' size='icon' variant='default'>
          <Menu className='h-7 w-7' />
          <span className='sr-only'>Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className='py-10'>
          <ul className='flex flex-col gap-y-7 '>
            {menuItems.map((item) => (
              <div key={item.name}>
                <div className='mb-4'>
                  <Link to={item.link}>{item.name}</Link>
                </div>

                <Separator />
              </div>
            ))}
          </ul>
        </div>
        <div
          onClick={() => logoutHandler()}
          className='text-destructive cursor-pointer'
        >
          Déconnexion
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default MobileMenu
