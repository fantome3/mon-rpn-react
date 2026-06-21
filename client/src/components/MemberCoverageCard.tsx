import { RpnStatus } from '@/types/User'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

type Props = {
  name: string
  relationship?: string
  membershipIncluded: boolean
  rpnStatus: RpnStatus
  rpnMatricule?: string
  isLoading?: boolean
  onToggleMembership?: () => void
  onToggleRpn?: () => void
}

const RPN_BADGE: Record<RpnStatus, { label: string; className: string }> = {
  enrolled:     { label: 'Inscrit au RPN',            className: 'bg-green-100 text-green-800' },
  pending:      { label: "En attente d'inscription",  className: 'bg-yellow-100 text-yellow-800' },
  not_enrolled: { label: 'Non inscrit au RPN',        className: 'bg-gray-100 text-gray-700' },
  unsubscribed: { label: 'Désinscrit du RPN',         className: 'bg-red-100 text-red-800' },
}

const MemberCoverageCard = ({
  name,
  relationship,
  membershipIncluded,
  rpnStatus,
  rpnMatricule,
  isLoading,
  onToggleMembership,
  onToggleRpn,
}: Props) => (
  <Card className='w-full'>
    <CardHeader className='pb-2 px-4 pt-4'>
      <div className='flex items-center gap-2 flex-wrap'>
        <CardTitle className='text-sm sm:text-base'>{name}</CardTitle>
        {relationship ? (
          <Badge variant='outline' className='text-xs font-normal'>
            {relationship}
          </Badge>
        ) : (
          <Badge variant='outline' className='text-xs font-normal border-primary text-primary'>
            Membre principal
          </Badge>
        )}
      </div>
    </CardHeader>

    <CardContent className='space-y-4 px-4 pb-4'>
      {/* ── Membership ── */}
      <div className='space-y-2'>
        <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
          Membership
        </p>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          {membershipIncluded ? (
            <Badge className='bg-green-100 text-green-800 font-normal self-start'>
              Inclus dans le membership
            </Badge>
          ) : (
            <Badge variant='outline' className='border-red-400 text-red-600 font-normal self-start'>
              Exclu du membership
            </Badge>
          )}
          {onToggleMembership && (
            <Button
              variant='outline'
              size='sm'
              disabled={isLoading}
              onClick={onToggleMembership}
              className={
                membershipIncluded
                  ? 'border-red-400 text-red-600 hover:bg-red-50 text-xs w-full sm:w-auto'
                  : 'border-primary text-primary hover:bg-primary/5 text-xs w-full sm:w-auto'
              }
            >
              {membershipIncluded ? 'Exclure du membership' : 'Inclure dans le membership'}
            </Button>
          )}
        </div>
      </div>

      {/* ── Fonds RPN ── */}
      <div className='space-y-2'>
        <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
          Fonds RPN{' '}
          <span className='hidden sm:inline normal-case font-normal text-muted-foreground/70'>
            — fonds d'entraide versé en cas de décès
          </span>
        </p>
        {membershipIncluded ? (
          <div className='space-y-2'>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-center gap-2 flex-wrap'>
                <Badge className={`${RPN_BADGE[rpnStatus].className} font-normal`}>
                  {RPN_BADGE[rpnStatus].label}
                </Badge>
                {rpnMatricule && (
                  <span className='text-xs text-muted-foreground'>#{rpnMatricule}</span>
                )}
              </div>
              {onToggleRpn && rpnStatus !== 'pending' && (
                <Button
                  variant='outline'
                  size='sm'
                  disabled={isLoading}
                  onClick={onToggleRpn}
                  className={
                    rpnStatus === 'enrolled'
                      ? 'border-red-400 text-red-600 hover:bg-red-50 text-xs w-full sm:w-auto'
                      : 'border-primary text-primary hover:bg-primary/5 text-xs w-full sm:w-auto'
                  }
                >
                  {rpnStatus === 'enrolled' ? 'Désinscrire du RPN' : 'Inscrire au RPN'}
                </Button>
              )}
            </div>
            {rpnStatus === 'pending' && (
              <p className='text-xs text-yellow-700 italic'>
                Inscription en cours de traitement…
              </p>
            )}
          </div>
        ) : (
          <p className='text-xs text-muted-foreground italic'>
            Non applicable — inclure ce membre dans le membership pour bénéficier du fonds RPN.
          </p>
        )}
      </div>
    </CardContent>
  </Card>
)

export default MemberCoverageCard
