import { getYear } from 'date-fns'

type FooterProps = {
  hasBorder?: boolean
}

const Footer = ({ hasBorder = true }: FooterProps) => {
  return (
    <div className={`w-full bg-[#eff1f4] ${hasBorder ? 'border-t' : ''}`}>
      <div className='container py-10 md:py-20 lg:py-30'>
        <div className='items-start gap-8 md:text-xl text-sm text-slate-400 font-extrabold'>
          Ensemble, nous sommes plus forts.
        </div>
      </div>
      <div className='container pb-2 text-slate-400 md:text-lg text-sm'>
        © {getYear(new Date())} ACQ-RPN - Tous droits réservés
      </div>
    </div>
  )
}

export default Footer
