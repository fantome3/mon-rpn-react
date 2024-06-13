import SponsorshipCode from './SponsorshipCode'
import PaymentMethodInfo from './PaymentMethodInfo'
import UserConnexion from './UserConnexion'

const ProfilInfoConnexion = () => {
  return (
    <div className='flex flex-col w-full gap-y-3'>
      <UserConnexion />
      <SponsorshipCode />
      <PaymentMethodInfo />
    </div>
  )
}

export default ProfilInfoConnexion
