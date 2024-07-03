import { Outlet } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import { Button } from './components/ui/button'
import { useNavigate } from 'react-router-dom'
import apiClient from './apiClient'
import { Store } from './lib/Store'

const App = () => {
  const [showButton, setShowButton] = useState(false)
  const navigate = useNavigate()
  const { logoutHandler } = useContext(Store)

  useEffect(() => {
    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          logoutHandler()
          navigate('/login')
        }
        return Promise.reject(error)
      }
    )

    return () => {
      apiClient.interceptors.response.eject(responseInterceptor)
    }
  }, [navigate])

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
