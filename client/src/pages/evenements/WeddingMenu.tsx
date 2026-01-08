import { SearchEngineOptimization } from '@/components/SearchEngine/SearchEngineOptimization'
import { motion } from 'framer-motion'
import floconNeige from '@/assets/flocon-neige-anime.gif'
import rokiaEtRomeo from '@/assets/rokia_&_romeo.jpg'

const sections = [
  {
    title: 'Amuse-bouche',
    description:
      'Textures délicates, jeux de saveurs florales et acidulées pour briser l\'ennui.',
    items: [
      {
        name: 'Mini Quiche',
        description: 'petites bouchées salées garnies de légumes et viande',
        image:
          'https://cdn.thefreshmancook.com/wp-content/uploads/2024/06/Crustless-Mini-Quiche-Recipe-2-1024x771.png',
      },
      {
        name: 'samoussas',
        description: 'triangles croustillants farcis de viande ou de légumes, inspirés des saveurs africaines et asiatiques.',
        image:
          'https://assets.afcdn.com/recipe/20200218/107814_w1024h768c1cx960cy540cxt0cyt0cxb1920cyb1080.jpg',
      }
    ],
  },
  {
    title: 'Plats Signature',
    description: '',
    items: [
      {
        name: 'Ndolet',
        description: 'plat camerounais à base de feuilles amères mijotées avec arachides et viande ou poisson.',
        image:
          'https://th.bing.com/th/id/OIP.ezV2IMhqBI68xjUmthr95QHaE8?w=282&h=187&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
      },
      {
        name: 'Tchep rouge au poisson',
        description: 'riz sénégalais parfumé à la tomate et aux épices, accompagné de poisson.',
        image:
          'https://answersafrica.com/wp-content/uploads/2017/03/benachin.jpg',
      },
      {
        name: 'Vermicelles au poulet',
        description: 'pâtes fines sautées avec morceaux de poulet et légumes, relevées d’épices douces.',
        image:
          'https://i.pinimg.com/originals/a7/cf/c1/a7cfc142839fccdea28fc3306fb78123.jpg',
      },
      {
        name: 'Sauce feuille',
        description: 'spécialité ivoirienne préparée avec feuilles vertes locales, viande ou poisson, et assaisonnements traditionnels.',
        image:
          'https://www.cuisinedecheznous.net/wp-content/uploads/2022/04/sauce-feuille-patate-cuisine-ivoirienne-ivorianfood.jpg',
      },
      {
        name: 'Choukouya De Mouton',
        description: 'brochettes de viande de mouton marinée aux épices et braisées, plat populaire en Côte d\'Ivoire.',
        image:
          'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2b/e6/06/24/choukouya.jpg?w=1200&h=-1&s=1',
      },
    ],
  },
  {
    title: 'Bar à Desserts',
    description: 'Gâteaux à partager par les mariés',
    items: [
      {
        name: 'À dévoiler par les mariés',
        description: '',
        image:
          'https://th.bing.com/th/id/OIP.sLVnpZGObKoLhNIneH_GkAHaEO?w=326&h=186&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
      }
    ],
  },
  {
    title: 'Bar',
    description:
      'Boissons pour accompagner le repas',
    items: [
      {
        name: 'Mocktail – Jus de fruit',
        description: 'Mélange rafraîchissant de jus de fruits tropicaux.',
        image:
          'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Cocktail – vin rouge',
        image:
          'https://i0.wp.com/www.toutsurlevin.ca/wp-content/uploads/2019/01/d%C3%A9gustation-de-vin-tout-sur-le-vin.png?fit=1024%2C1024',
      },
    ],
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
          <section className='px-6 lg:px-10'>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7 }}
              className='mx-auto flex max-w-4xl flex-col items-center gap-10 rounded-3xl border border-[#D4AF37]/25 bg-slate-900/70 p-10 shadow-[0_30px_80px_-40px_rgba(10,24,56,0.65)] backdrop-blur'
            >
              <img
                src={rokiaEtRomeo}
                alt='Roméo & Rokia'
                className='h-66 w-64 rounded-full border-4 border-[#D4AF37]/60 object-cover shadow-[0_15px_45px_-30px_rgba(212,175,55,0.8)]'
                loading='lazy'
              />
              <div className='text-center space-y-4'>
                <h2 className='text-3xl font-semibold text-[#D4AF37] md:text-4xl'>
                  Roméo & Rokia
                </h2>
                <p className='text-base leading-relaxed text-slate-200/80'>
                  Deux âmes, deux héritages, une promesse éternelle.
                </p>
                <p className='text-base leading-relaxed text-slate-200/80'>
                  Unis par des racines camerounaises et ivoiriennes, nos histoires se rencontrent dans un amour vibrant, 
                  respectueux des traditions et de leurs divergences.
                </p>
                <p className='text-base leading-relaxed text-slate-200/80'>
                  Ce menu est l’écrin culinaire de notre célébration, une valse de saveurs soigneusement orchestrée pour ravir vos sens.
                </p>
                <p className='text-sm uppercase tracking-[0.35em] text-slate-200/55'>
                  “Deux cultures, une lumière commune.”
                </p>
              </div>
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
                du premier amuse-bouche au dessert, chaque accord célèbre l’union de nos
                cultures et la joie de votre présence. Laissez-vous
                guider par les textures, arômes et la musique du téroire.
              </p>
            </motion.div>
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
                Menu
              </h2>
            </motion.div>

            <div className='mt-16 grid gap-14'>
              {sections.map((section) => (
                <motion.article
                  key={section.title}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
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
                            {item.description}
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