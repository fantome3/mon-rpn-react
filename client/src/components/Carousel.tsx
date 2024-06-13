import * as React from 'react'
import Autoplay from 'embla-carousel-autoplay'
import { Card } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import { carousel_images } from '@/lib/constant'

export function CarouselPlugin() {
  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: false })
  )

  return (
    <Carousel plugins={[plugin.current]} className='w-full flex flex-col gap-2'>
      <CarouselContent>
        {carousel_images.map((img) => (
          <CarouselItem key={img}>
            <Card className='md:h-[700px]  h-[300px]'>
              <img
                className='w-full object-cover md:h-[700px] 
                 h-[300px]'
                src={img}
              />
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
