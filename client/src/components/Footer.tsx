import { Separator } from './ui/separator'

const Footer = () => {
  return (
    <div className='w-full border-t'>
      <div className='container py-10 md:py-20 lg:py-30 grid gap-4 px-4 text-center md:px-6'>
        <div className='mx-auto grid max-w-sm items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-4'>
          <div className='flex w-full items-center justify-center p-4 sm:p-8'>
            <img
              alt='Logo'
              className='aspect-[2/1] overflow-hidden rounded-lg object-contain object-center'
              height='90'
              src='/placeholder.svg'
              width='180'
            />
          </div>
          <div className='flex w-full items-center justify-center p-4 sm:p-8'>
            <img
              alt='Logo'
              className='aspect-[2/1] overflow-hidden rounded-lg object-contain object-center'
              height='90'
              src='/placeholder.svg'
              width='180'
            />
          </div>
          <div className='flex w-full items-center justify-center p-4 sm:p-8'>
            <img
              alt='Logo'
              className='aspect-[2/1] overflow-hidden rounded-lg object-contain object-center'
              height='90'
              src='/placeholder.svg'
              width='180'
            />
          </div>
          <div className='flex w-full items-center justify-center p-4 sm:p-8'>
            <img
              alt='Logo'
              className='aspect-[2/1] overflow-hidden rounded-lg object-contain object-center'
              height='90'
              src='/placeholder.svg'
              width='180'
            />
          </div>
        </div>
        <Separator />
      </div>
    </div>
  )
}

export default Footer
