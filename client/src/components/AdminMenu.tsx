import { adminMenuItems } from '@/lib/constant'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from './ui/menubar'
import { Link } from 'react-router-dom'

const AdminMenu = () => {
  return (
    <Menubar className='bg-primary border-primary '>
      <MenubarMenu>
        <MenubarTrigger>Admin </MenubarTrigger>
        <MenubarContent>
          {adminMenuItems.map((item) => (
            <Link key={item.name} to={item.link}>
              <MenubarItem>{item.name}</MenubarItem>
            </Link>
          ))}
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}

export default AdminMenu
