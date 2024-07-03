import { useContext } from 'react'
import { Store } from '@/lib/Store'
import { BarChart4 } from 'lucide-react'
import AddMemberSection from './AddMemberSection'
import GraphSection from './GraphSection'
import UserAccountInfo from './UserAccountInfo'
import CurrentMonthStat from './CurrentMonthStat'
import TotalDeath from './TotalDeath'
import { useGetSummaryQuery } from '@/hooks/deathAnnouncementHook'
import LastAnnouncements from './LastAnnouncements'

const UserHomPage = () => {
  const { state } = useContext(Store)
  const { userInfo } = state
  const { data: summary } = useGetSummaryQuery()

  return (
    <>
      <div className='container mb-10'>
        <h1 className='text-center pt-10 mb-2 text-3xl font-semibold'>
          Bienvenue {userInfo?.origines.firstName}
        </h1>
        <p className='text-center text-xl font-light mb-10'>
          Ensemble, nous sommes plus forts.
        </p>
        <div className=' flex justify-center gap-10 md:flex-row flex-col-reverse md:p-10  p-4 items-center bg-primary text-white tracking-wide leading-loose rounded-md mb-10'>
          <div className='md:w-[40%] w-full text-center md:text-justify'>
            <p>
              Merci de faire partir de notre communauté Nous pouvons encore
              réduire le montant de nos côtisations en invitant des proches qui
              n'ont pas encore connaissance de notre existence.
            </p>
            <p className='mt-4'>
              Ensemble allégeons le fardeau de nos familles
            </p>
          </div>

          <div>
            <BarChart4 size={200} />
          </div>
        </div>
        <AddMemberSection />
        <div className='grid sm:grid-cols-3 gap-4'>
          <UserAccountInfo />
          <CurrentMonthStat
            data={
              summary &&
              summary?.currentMonthPrevieww[0]?.month[0]?.totalDeaths !==
                undefined
                ? summary?.currentMonthPrevieww[0]?.month[0]?.totalDeaths
                : 0
            }
          />
          <TotalDeath data={summary ? summary?.deaths[0]?.numDeaths : 0} />
        </div>

        <GraphSection data={summary ? summary.totalMonthly : []} />
        <LastAnnouncements />
      </div>
    </>
  )
}

export default UserHomPage
