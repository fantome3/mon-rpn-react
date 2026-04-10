import BillingFaq from '@/components/billing/BillingFaq'
import { SearchEngineOptimization } from '@/components/SearchEngine/SearchEngineOptimization'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BILLING_FAQ_ITEMS } from '@/lib/billingFaq'

const FAQ_CATEGORIES = [
  {
    id: 'facturation',
    title: 'Facturation',
    description:
      'Paiement Interac, montants à saisir, statut de vérification et blocages.',
    count: BILLING_FAQ_ITEMS.length,
  },
]

function FrequentlyAskedQuestions() {
  return (
    <>
      <SearchEngineOptimization
        title='FAQ'
        description='Réponses rapides aux questions les plus fréquentes.'
      />
      <div className='container mb-10 space-y-8 pt-10'>
        <div className='grid gap-4 sm:grid-cols-2'>
          {FAQ_CATEGORIES.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base'>{category.title}</CardTitle>
                  <Badge variant='secondary'>
                    {category.count} réponse{category.count > 1 ? 's' : ''}
                  </Badge>
                </div>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant='link' className='h-auto p-0 text-sm'>
                  <a href={`#${category.id}`}>Voir la section</a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <section id='facturation' className='scroll-mt-24'>
          <BillingFaq />
        </section>
      </div>
    </>
  )
}

export default FrequentlyAskedQuestions
