import { engagements } from '@/lib/constant'
import { Card, CardContent } from './ui/card'
import { Check } from 'lucide-react'
import engagamentImage from '@/assets/engagement.png'
import CustomButton from './CustomButton'
import { motion } from 'framer-motion'

const EngagementSection = () => {
  return (
    <motion.div className='container md:pt-16  pt-8 flex justify-between items-center md:flex-row flex-col gap-4'>
      <motion.div
        whileHover={{ scale: 1.2 }}
        onHoverStart={(e) => {}}
        onHoverEnd={(e) => {}}
        className=' w-full'
      >
        <Card>
          <CardContent className='flex aspect-square items-center justify-center p-6'>
            <img
              className='object-cover w-full h-full rounded-sm'
              src={engagamentImage}
              alt='engagement_image'
            />
          </CardContent>
        </Card>
      </motion.div>
      <div className='w-full '>
        <h2 className='font-extrabold lg:text-[36px] text-[20px] text-center lg:mt-0 mt-8'>
          Notre engagement
        </h2>

        {engagements.map((engagement) => (
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
    </motion.div>
  )
}

export default EngagementSection
