import { getYear } from 'date-fns'

const Footer = () => {
  return (
    <div className='w-full border-t bg-[#eff1f4]'>
      <div className='container py-10 md:py-20 lg:py-30'>
        <div className='items-start gap-8 md:text-xl text-sm text-slate-400 font-extrabold'>
          Ensemble, nous sommes plus forts.
        </div>
      </div>
      <div className='container pb-2 text-slate-400 md:text-lg text-sm'>
        © {getYear(new Date())} MONRPN - Tous droits réservés
      </div>
    </div>
  )
}

export default Footer
