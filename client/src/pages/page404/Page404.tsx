import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { SearchEngineOptimization } from '@/components/SearchEngineOptimization'

const Page404 = () => {
  const navigate = useNavigate()
  return (
    <>
      <SearchEngineOptimization title='404' />
      <div className='auth flex h-screen items-center justify-center text-center'>
      <div className='w-[80%]'>
        <h1 className='font-extrabold text-primary md:text-9xl text-4xl'>
          Oops!
        </h1>
        <h2 className='md:mt-4  mt-2 md:text-2xl text-xl font-bold'>
          404 - PAGE NOT FOUND
        </h2>
        <p className='mt-8 text-slate-600 md:px-0 px-4 text-sm'>
          La page que vous chercher n'existe pas,
          <br /> a peut être été retirée ou <br />
          est temporairement indisponible.
        </p>
        <Button
          onClick={() => navigate('/')}
          className='md:mt-6 mt-4 md:px-8 md:py-4 px-4 py-2'
        >
          Retour à la page d'accueil
        </Button>
      </div>
    </div>
    </>
  )
}

export default Page404
