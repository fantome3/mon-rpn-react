import ProfilInfoConnexion from '@/components/ProfilInfoConnexion'
import ProfilPersonnalInfo from '@/components/ProfilPersonnalInfo'
import ProfilLayout from '@/components/ProfilLayout'
import { SearchEngineOptimization } from '@/components/SearchEngine/SearchEngineOptimization'

const Profil = () => (
  <>
    <SearchEngineOptimization title='Profil utilisateur' />
    <ProfilLayout>
      <div className='flex justify-between gap-4 md:flex-row flex-col'>
        <ProfilPersonnalInfo />
        <ProfilInfoConnexion />
      </div>
    </ProfilLayout>
  </>
)

export default Profil
