import { SearchEngineOptimization } from '@/components/SearchEngineOptimization'

const AccountDeactivated = () => {
  return (
    <>
      <SearchEngineOptimization title='Compte désactivé' />
      <div className='text-center py-20'>
        <h1 className='text-3xl font-bold text-red-600'>Compte désactivé</h1>
        <p className='mt-4 text-gray-700'>
          Votre compte a été désactivé suite à une régularisation non effectuée.
        </p>
        <p className='mt-2'>
          Contactez l'administration pour plus d'informations.
        </p>
      </div>
    </>
  )
}

export default AccountDeactivated
