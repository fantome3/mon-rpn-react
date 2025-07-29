import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ConditionsContent from '@/components/ConditionsContent'
import { SearchEngineOptimization } from '@/components/SearchEngineOptimization'
const Conditions = () => {
  return (
    <>
      <SearchEngineOptimization title='Conditions' />
      <Header />
      <div className='auth flex h-screen items-center justify-center text-center bg-cover bg-center bg-fixed'>
        <ConditionsContent />
      </div>
      <Footer />
    </>
  )
}

export default Conditions
