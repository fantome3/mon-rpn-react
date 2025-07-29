import Announcement from '@/components/Announcement'
import Navbar from '@/components/Header'
import { CarouselPlugin } from '@/components/Carousel'
import InfoSection from '@/components/InfoSection'
import EngagementSection from '@/components/EngagementSection'
import RejoinsSection from '@/components/RejoinsSection'
import BannerSection from '@/components/BannerSection'
import CardsSection from '@/components/CardsSection'
import Footer from '@/components/Footer'
import { SearchEngineOptimization } from '@/components/SearchEngineOptimization'

const HomePage = () => {
  return (
    <>
      <SearchEngineOptimization title='Accueil' />
      <Announcement />
      <Navbar />
      <CarouselPlugin />
      <InfoSection />
      <EngagementSection />
      <RejoinsSection />
      <BannerSection />
      <CardsSection />
      <Footer />
    </>
  )
}

export default HomePage
