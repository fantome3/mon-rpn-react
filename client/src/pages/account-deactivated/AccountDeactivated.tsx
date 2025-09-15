import Footer from "@/components/Footer"
import Header from "@/components/Header"

const AccountDeactivated = () => {
  return (
    <div className="min-h-screen bg-[#eff1f4]">
      <Header />
      <div className='text-center py-20'>
        <h1 className='text-3xl font-bold text-red-600'>Compte désactivé</h1>
        <p className='mt-4 text-gray-700'>
          Votre compte a été désactivé suite à une régularisation non effectuée.
        </p>
        <p className='mt-2'>
          Contactez l'administration pour plus d'informations.
        </p>
      </div>
      <Footer />
    </div>
  )
}

export default AccountDeactivated
