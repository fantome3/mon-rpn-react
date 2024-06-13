import { Card, CardContent } from './ui/card'
import { rejoins } from '@/lib/constant'
import { Check } from 'lucide-react'
import rejoins_image from '@/assets/rejoins.png'
import CustomButton from './CustomButton'
import { motion } from 'framer-motion'

const RejoinsSection = () => {
  return (
    <div className='container md:pt-16  pt-8 flex justify-between items-center  md:flex-row flex-col-reverse gap-4'>
      <div className='w-full '>
        <h2 className='font-extrabold lg:text-[36px] text-[20px] text-center lg:mt-0 mt-8'>
          Rejoint le mouvement
        </h2>

        {rejoins.map((engagement) => (
          <div className='ml-8' key={engagement.id}>
            <div className='flex items-center justify-start gap-2 p-3 text-sm'>
              <Check size={35} className='text-primary' />
              <h3 className='font-semibold'>{engagement.title}</h3>
            </div>
            <p className='text-slate-500 text-sm'>{engagement.desc}</p>
          </div>
        ))}

        <CustomButton />
      </div>
      <motion.div whileHover={{ scale: 1.2 }} className=' w-full'>
        <Card>
          <CardContent className='flex aspect-square items-center justify-center p-6'>
            <img
              className='object-cover w-full h-full rounded-sm'
              src={rejoins_image}
              alt='rejoins_image'
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default RejoinsSection
