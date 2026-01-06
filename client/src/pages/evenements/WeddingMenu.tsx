import { SearchEngineOptimization } from '@/components/SearchEngine/SearchEngineOptimization'
import { motion } from 'framer-motion'
import floconNeige from '@/assets/flocon-neige-anime.gif'

const sections = [
  {
    title: 'Amuse-bouche & Entrées',
    description:
      'Textures délicates, jeux de saveurs florales et acidulées pour ouvrir le bal.',
    items: [
      {
        name: 'Ndolet crevette',
        image:
          'https://th.bing.com/th/id/OIP.ezV2IMhqBI68xjUmthr95QHaE8?w=282&h=187&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
      },
      {
        name: 'Tartare de daurade, crème de yuzu et pétales comestibles',
        image:
          'https://images.unsplash.com/photo-1481931098730-318b6f776db0?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    title: 'Plats Signature',
    description:
      'Des accords couture qui mêlent terroir français et touches exotiques.',
    items: [
      {
        name: 'Filet de boeuf en croûte truffée, jus réduit au cacao',
        image:
          'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Bar rôti, écume de citronnelle, asperges glacées',
        image:
          'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    title: 'Douceurs & Bar à Desserts',
    description:
      'Un final pétillant aux textures aériennes et notes florales.',
    items: [
      {
        name: 'Sphère chocolat-blanc, coeur passion et éclats d’or',
        image:
          'https://th.bing.com/th/id/OIP.sLVnpZGObKoLhNIneH_GkAHaEO?w=326&h=186&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
      },
      {
        name: 'Entremets framboise-litchi, meringue cristal',
        image:
          'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
  {
    title: 'Signature Bar',
    description:
      'Mixologie sur-mesure avec floral, bulles et touches fumées.',
    items: [
      {
        name: 'Cocktail “Éclat de Nuit” – gin infusé à la lavande, champagne, fumée de thym',
        image:
          'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Mocktail “Lueur” – verveine, poire, tonic pétillant',
        image:
          'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=800&q=80',
      },
    ],
  },
]

const experienceHighlights = [
  {
    title: 'Ambiance',
    description:
      'Un ballet de lumières bleutées, ponctué d’or et de cristal, pour accueillir vos proches dans une atmosphère feutrée.',
  },
  {
    title: 'Signature culinaire',
    description:
      'Chaque assiette mêle élégance française et clins d’œil aux racines africaines des mariés.',
  },
  {
    title: 'Service',
    description:
      'Une brigade aux gestes précis, un timing maîtrisé et une attention discrète pour vos convives.',
  },
]

export default function WeddingMenu() {
  return (
    <>
      <SearchEngineOptimization
        title='Menu de Mariage'
        description='Menu mariage Roméo & Rokia'
      />
      <div className='relative min-h-screen overflow-hidden text-slate-100'>
        <div className='pointer-events-none fixed inset-0 z-[-2]'>
          <img
            src={floconNeige}
            alt='Flocons animés'
            className='h-full w-full object-cover object-center'
          />
        </div>
        <div className='pointer-events-none fixed inset-0 z-[-1] bg-gradient-to-br from-slate-950/70 via-slate-950/45 to-slate-900/40' />
        <main className='relative z-10'>
          <section className='flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center lg:px-10'>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1 }}
              className='max-w-3xl space-y-6'
            >
              <p className='tracking-[0.4em] text-xs uppercase text-[#D4AF37]'>
                Roméo & Rokia
              </p>
              <h1 className='text-4xl font-semibold text-[#D4AF37] md:text-6xl'>
                Bienvenue à notre union
              </h1>
              <p className='text-lg text-slate-200/80 md:text-xl'>
                Deux âmes, deux héritages, une promesse éternelle. Merci de
                célébrer avec nous ce moment d’union et d’amour, sous la
                valse de dégustations soigneusement orchestrée pour ravir vos sens.
              </p>
            </motion.div>
          </section>

          <section className='px-6 py-24 lg:px-10'>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className='mx-auto max-w-3xl text-center'
            >
              <h2 className='text-3xl font-semibold text-[#D4AF37] md:text-4xl'>
                Notre promesse à vos sens
              </h2>
              <p className='mt-6 text-base leading-relaxed text-slate-200/80'>
                Ce menu a été conçu comme un voyage sensoriel : du premier
                toast aux desserts, chaque accord célèbre l’union de nos
                cultures et l’élégance contemporaine de votre soirée. Laissez-vous
                guider par les textures, arômes et jeux de lumière.
              </p>
            </motion.div>

            {/* <div className='mt-16 grid gap-8 md:grid-cols-3'>
              {experienceHighlights.map(({ title, description }) => (
                <motion.article
                  key={title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.6 }}
                  className='rounded-2xl border border-[#D4AF37]/30 bg-slate-900/70 p-6 shadow-[0_20px_60px_-30px_rgba(4,20,60,0.65)]'
                >
                  <h3 className='text-xl font-medium text-[#D4AF37]'>{title}</h3>
                  <p className='mt-3 text-sm text-slate-200/70'>{description}</p>
                </motion.article>
              ))}
            </div> */}
          </section>

          <section className='px-6 pb-24 lg:px-10'>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className='mx-auto max-w-4xl text-center'
            >
              <h2 className='text-3xl font-semibold text-[#D4AF37] md:text-4xl'>
                Menu Signature
              </h2>
              <p className='mt-4 text-sm uppercase tracking-[0.4em] text-slate-200/60'>
                Élégance moderne & raffinement intemporel
              </p>
            </motion.div>

            <div className='mt-16 grid gap-14'>
              {sections.map((section) => (
                <motion.article
                  key={section.title}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6 }}
                  className='rounded-3xl border border-[#D4AF37]/20 bg-slate-900/75 p-8 shadow-[0_30px_80px_-40px_rgba(10,24,56,0.8)] backdrop-blur'
                >
                  <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                    <h3 className='text-2xl font-semibold text-[#D4AF37]'>
                      {section.title}
                    </h3>
                    <span className='h-px flex-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent sm:mx-8' />
                    <p className='max-w-xl text-sm text-slate-200/70'>
                      {section.description}
                    </p>
                  </div>

                  <div className='mt-10 grid gap-8 md:grid-cols-2'>
                    {section.items.map((item) => (
                      <div
                        key={item.name}
                        className='group overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-slate-950/60 shadow-lg shadow-slate-950/50 transition hover:-translate-y-1 hover:border-[#D4AF37]/50'
                      >
                        <figure className='relative aspect-[4/3] overflow-hidden'>
                          <img
                            src={item.image}
                            alt={item.name}
                            className='h-full w-full object-cover transition duration-700 group-hover:scale-105'
                            loading='lazy'
                          />
                          <div className='absolute inset-0 bg-gradient-to-tr from-slate-950/55 via-transparent to-transparent' />
                        </figure>
                        <div className='p-6'>
                          <h4 className='text-lg font-medium text-[#D4AF37]'>
                            {item.name}
                          </h4>
                          <p className='mt-2 text-sm text-slate-200/70'>
                            Accord suggéré, service à l’assiette.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.article>
              ))}
            </div>
          </section>

          <footer className='border-t border-[#D4AF37]/20 px-6 py-12 text-center text-xs uppercase tracking-[0.35em] text-slate-200/60 lg:px-10'>
            L’union de Roméo & Rokia — Cameroun & Côte d’Ivoire — 2026
          </footer>
        </main>
      </div>
    </>
  )
}