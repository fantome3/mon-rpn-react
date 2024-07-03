import { cardContent } from '@/lib/constant'
import { Card, CardContent, CardFooter, CardHeader } from './ui/card'
import { ArrowRight } from 'lucide-react'
import { Button } from './ui/button'
import { motion } from 'framer-motion'

const CardsSection = () => {
  return (
    <div className='container md:pt-16 pt-8 md:pb-16 pb-8 flex md:flex-row flex-col justify-center items-center'>
      {cardContent.map((content) => (
        <motion.div whileHover={{ scale: 1.2 }} key={content.id}>
          <Card className='w-[380px] h-[400px] mt-4 md:mt-0 bg-slate-100'>
            <CardHeader className='flex items-center'>
              <content.headerIcon className='text-primary' size={45} />
              <h3 className='font-semibold text-primary text-xl'>
                {content.title}
              </h3>
            </CardHeader>
            <CardContent className='flex flex-col  items-center justify-center mt-8 mb-8'>
              <p className='text-sm text-slate-500 text-justify'>
                {content.desc}
              </p>
            </CardContent>
            <CardFooter className='flex gap-2 text-primary justify-center'>
              <Button variant='link'>
                <a href={content.link} target='_blank'>
                  {content.footerText}
                </a>
                <ArrowRight />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

export default CardsSection
