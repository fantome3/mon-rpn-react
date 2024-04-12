import UserAddress from './UserAddress'
import UserConnexion from './UserConnexion'

const ProfilInfoConnexion = () => {
  return (
    <div className='flex flex-col w-full gap-y-3'>
      <UserConnexion />
      <UserAddress />
    </div>
  )
}

export default ProfilInfoConnexion
