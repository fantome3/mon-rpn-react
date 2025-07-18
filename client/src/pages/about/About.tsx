import rejoins_image from '@/assets/rejoins.png'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const leaders = [
  {
    name: 'Jean Mbarga',
    role: 'Trésorier',
    image: rejoins_image,
  },
  {
    name: 'Sophie Ngo',
    role: 'Resp. activités sportives',
    image: rejoins_image,
  },
  {
    name: 'Me Alain Toko',
    role: 'Conseiller juridique',
    image: rejoins_image,
  },
]

const About = () => {
  return (
    <div className="min-h-screen bg-[#eff1f4]">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Président */}
        <section className="flex flex-col md:flex-row items-center text-center md:text-left gap-6 md:gap-10">
          <img
            src={rejoins_image}
            alt="Président de l'association"
            className="w-36 h-36 md:w-48 md:h-48 object-cover rounded-full shadow-lg animate-fade-in"
          />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Bienvenue</h1>
            <p className="text-gray-600 text-base md:text-lg max-w-xl">
              Je vous souhaite la bienvenue au nom de toute l'association. Ensemble,
              nous construisons une communauté forte, solidaire et ambitieuse.
            </p>
            <p className="mt-4 font-semibold text-indigo-600">— Pr. Joseph N. DINGA</p>
          </div>
        </section>

        {/* Équipe */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 text-center">Je suis accompagné dans cette tâche par</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {leaders.map((person) => (
              <div
                key={person.name}
                className="bg-gray-100 rounded-xl shadow-lg p-4 flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300 animate-fade-in-up"
              >
                <img
                  src={person.image}
                  alt={person.name}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover mb-3"
                />
                <h3 className="text-md md:text-lg font-semibold text-gray-800">{person.name}</h3>
                <p className="text-sm text-gray-500">{person.role}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Footer hasBorder={false} />
    </div>
  )
}

export default About
