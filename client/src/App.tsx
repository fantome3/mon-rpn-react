import { Outlet } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from './components/ui/button'

const App = () => {
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    const handleScrollButtonVisibility = () => {
      window.scrollY > 300 ? setShowButton(true) : setShowButton(false)
    }
    window.addEventListener('scroll', handleScrollButtonVisibility)
    return () => {
      window.removeEventListener('scroll', handleScrollButtonVisibility)
    }
  }, [])

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      <Outlet />
      {showButton ? (
        <Button
          onClick={handleScrollToTop}
          className='fixed w-[50px] h-[50px] bottom-[55px] right-[20px] bg-primary hover:bg-white rounded-full shadow-lg shadow-slate-600 z-[100]'
        >
          <ArrowUp className='text-white hover:text-primary' />
        </Button>
      ) : (
        ''
      )}
    </div>
  )
}

export default App
