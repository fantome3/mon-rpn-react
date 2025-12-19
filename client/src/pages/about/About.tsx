import { motion } from 'framer-motion'
import { Quote, Sparkles } from 'lucide-react'
import headOfState from '@/assets/headOfState.jpg'
import minRex from '@/assets/chef-minRex.jpg'
import haut_commisaire from '@/assets/haut-commissaire.jpg'
import photoPresident from '@/assets/photoPresident.jpeg'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { SearchEngineOptimization } from '@/components/SearchEngine/SearchEngineOptimization'

const leaders = [
  {
    name: 'S.E Ngole Philip Ngwese',
    role: 'Haut-commissaire du Cameroun au Canada',
    image: haut_commisaire,
  },
  {
    name: 'S.E Lejeune Mbella Mbella',
    role: 'Ministre des relations extérieures',
    image: minRex,
  },
  {
    name: 'S.E Paul Biya',
    role: 'Président de la République du Cameroun',
    image: headOfState,
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function About() {
  return (
    <>
      <SearchEngineOptimization title="À propos de l'ACQ" description="Pourquoi l'ACQ existe et ce que nous faisons" />
      <div className="min-h-screen bg-[#eff1f4]">
        <Header />

        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(60rem_60rem_at_20%_-10%,#4f46e5_0%,transparent_60%),radial-gradient(40rem_40rem_at_90%_20%,#14b8a6_0%,transparent_60%)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <motion.div
              className="flex flex-col md:flex-row items-center text-center md:text-left gap-8 md:gap-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
              transition={{ duration: 0.6 }}
            >
              <img
                src={photoPresident}
                alt="Président de l'association"
                className="w-36 h-36 md:w-48 md:h-48 object-cover rounded-full shadow-xl ring-4 ring-white/70"
                loading="lazy"
              />

              <div className="relative">
                <div className="absolute -left-3 -top-3 hidden md:block text-indigo-600/20">
                  <Quote size={56} />
                </div>
                <h1 className="inline-flex items-center gap-2 text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                  Bienvenue à l’ACQ <Sparkles className="h-6 w-6 text-teal-500" />
                </h1>
                <p className="mt-2 text-sm md:text-base text-gray-500">Association des camerounaises et camerounais de Québec</p>

                {/* Cartouche du mot de bienvenue */}
                <div className="mt-6">
                  <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg ring-1 ring-gray-200 p-5 md:p-6">
                    <p className="text-gray-700 leading-relaxed">
                      C’est avec une immense joie que je vous souhaite la bienvenue sur le site officiel de
                      <span className="font-semibold"> l’Association des camerounaises et camerounais de Québec (ACQ)</span>.
                      Notre mission est claire : <span className="font-semibold">faciliter l’intégration des nouveaux arrivants </span>
                      dans leur nouvelle réalité québécoise, tout en renforçant les liens fraternels entre les membres de notre communauté.
                      L’ACQ est un espace de solidarité, de partage et de soutien, où chacun peut trouver des repères pour mieux s’épanouir au Québec.
                    </p>
                    <p className="mt-4 text-gray-700 leading-relaxed">
                      Au‑delà de l’accueil et de l’entraide locale, nous sommes également affiliés au
                      <span className="font-semibold"> Réseau du Retour au Pays Natal (RPN)</span>,
                      afin d’accompagner celles et ceux qui envisagent un retour funèbre au Cameroun. Garder un pont solide entre
                      le pays d’accueil et la terre d’origine est une richesse pour nous tous.
                    </p>
                    <p className="mt-4 text-gray-700 leading-relaxed">
                      Je vous invite à parcourir notre site, à découvrir nos initiatives et à participer activement à la vie associative.
                      Ensemble, bâtissons un réseau fort, dynamique et tourné vers l’avenir.
                    </p>

                    <div className="mt-5">
                      <p className="font-semibold text-indigo-700">— Dr. Nguewou DZalli Ghislain Brice</p>
                      <p className="text-sm text-gray-500">Président de l’ACQ</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.h2
            className="text-xl md:text-2xl font-bold text-gray-800 mb-6 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeUp}
          >
            Figures institutionnelles qui incarnent le Cameroun à l’international :
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {leaders.map((person, idx) => (
              <motion.article
                key={person.name}
                className="group bg-white rounded-2xl shadow-lg ring-1 ring-gray-200 p-6 flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <img
                  src={person.image}
                  alt={person.name}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover mb-4 ring-2 ring-indigo-100 group-hover:ring-indigo-300"
                  loading="lazy"
                />
                <h3 className="text-base md:text-lg font-semibold text-gray-900">{person.name}</h3>
                <p className="text-sm text-gray-500">{person.role}</p>
              </motion.article>
            ))}
          </div>
        </div>

        <Footer hasBorder={false} />
      </div>
    </>
  )
}
