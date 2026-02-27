import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, CreditCard, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { buildBillingPaymentUrl } from '@/lib/billing'

type FirstPaymentOnboardingCardProps = {
  activeDependentsCount: number
}

const FirstPaymentOnboardingCard = ({
  activeDependentsCount,
}: FirstPaymentOnboardingCardProps) => {
  const hasDependents = activeDependentsCount > 0

  return (
    <Card className='mb-6 border-primary/20 bg-gradient-to-br from-primary/10 via-background to-emerald-50'>
      <CardContent className='space-y-4 p-4 sm:p-6'>
        <div className='space-y-2'>
          <p className='text-lg font-semibold leading-tight'>
            Finalisez votre inscription en 2 étapes
          </p>
          <p className='text-sm text-muted-foreground'>
            Pour éviter un montant incorrect, renseignez d'abord vos personnes à
            charge, puis effectuez votre paiement.
          </p>
          <Badge variant={hasDependents ? 'default' : 'secondary'}>
            {hasDependents
              ? `${activeDependentsCount} personne(s) à charge enregistrée(s)`
              : 'Aucune personne à charge pour le moment'}
          </Badge>
        </div>

        <div className='space-y-3'>
          <div className='flex items-start gap-3 rounded-xl border bg-background/80 p-3'>
            {hasDependents ? (
              <CheckCircle2 className='mt-0.5 h-5 w-5 text-emerald-600' />
            ) : (
              <Circle className='mt-0.5 h-5 w-5 text-primary' />
            )}
            <div className='space-y-1'>
              <p className='font-medium'>Étape 1 - Personnes à charge</p>
              <p className='text-sm text-muted-foreground'>
                Utilisez le bouton "Ajouter une personne à charge" juste en
                dessous. Si vous n'en avez pas, passez à l'étape 2.
              </p>
            </div>
            <Users className='ml-auto h-5 w-5 text-muted-foreground' />
          </div>

          <div className='flex items-start gap-3 rounded-xl border bg-background/80 p-3'>
            <Circle className='mt-0.5 h-5 w-5 text-primary' />
            <div className='space-y-1'>
              <p className='font-medium'>Étape 2 - Paiement</p>
              <p className='text-sm text-muted-foreground'>
                Le montant est calculé selon votre profil et vos personnes à
                charge.
              </p>
            </div>
            <CreditCard className='ml-auto h-5 w-5 text-muted-foreground' />
          </div>
        </div>

        <Button asChild className='w-full sm:w-auto'>
          <Link to={buildBillingPaymentUrl('both')}>
            Continuer vers le paiement
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default FirstPaymentOnboardingCard
