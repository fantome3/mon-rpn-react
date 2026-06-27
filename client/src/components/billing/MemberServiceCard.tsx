import { Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'

export type MemberServiceCardProps = {
  memberId: string
  name: string
  relationship: string
  needsMembership: boolean
  needsRpn: boolean
  membershipFee: number
  rpnFee: number
  membershipLocked: boolean
  selMembership: boolean
  selRpn: boolean
  rpnDisabled: boolean
  onMembershipChange: (checked: boolean) => void
  onRpnChange: (checked: boolean) => void
}

export const MemberServiceCard = ({
  memberId,
  name,
  relationship,
  needsMembership,
  needsRpn,
  membershipFee,
  rpnFee,
  membershipLocked,
  selMembership,
  selRpn,
  rpnDisabled,
  onMembershipChange,
  onRpnChange,
}: MemberServiceCardProps) => {
  // Show membership row if: member needs to pay, OR membership is non-billable (e.g. minor → show as 0$)
  const showMembershipRow = needsMembership || (membershipLocked && membershipFee === 0)

  return (
    <Card className='w-full'>
      <CardHeader className='pb-2 px-4 pt-4'>
        <div className='flex items-center gap-2 flex-wrap'>
          <CardTitle className='text-sm sm:text-base'>{name}</CardTitle>
          <Badge variant='outline' className='text-xs font-normal'>
            {relationship}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='px-4 pb-4 space-y-3'>
        {showMembershipRow && (
          <div className='flex items-center justify-between min-h-[2.25rem]'>
            <div className='flex items-center gap-3'>
              {membershipLocked ? (
                <Lock className='h-4 w-4 shrink-0 text-muted-foreground' />
              ) : (
                <Checkbox
                  id={`membership-${memberId}`}
                  checked={selMembership}
                  onCheckedChange={(checked) => onMembershipChange(!!checked)}
                />
              )}
              <Label
                htmlFor={`membership-${memberId}`}
                className={`text-sm leading-tight ${membershipLocked ? 'text-muted-foreground' : 'cursor-pointer'}`}
              >
                Membership
                {membershipLocked && membershipFee === 0 && (
                  <span className='ml-1 text-xs'>— inclus automatiquement</span>
                )}
                {membershipLocked && membershipFee > 0 && (
                  <span className='ml-1 text-xs'>— obligatoire</span>
                )}
              </Label>
            </div>
            <span className={`text-sm font-semibold shrink-0 ${membershipLocked ? 'text-muted-foreground' : ''}`}>
              {membershipFee === 0 ? <span className='text-muted-foreground'>0 $</span> : formatCurrency(membershipFee)}
            </span>
          </div>
        )}

        {needsRpn && (
          <div className='flex items-center justify-between min-h-[2.25rem]'>
            <div className='flex items-center gap-3'>
              <Checkbox
                id={`rpn-${memberId}`}
                checked={selRpn}
                disabled={rpnDisabled}
                onCheckedChange={(checked) => onRpnChange(!!checked)}
              />
              <Label
                htmlFor={`rpn-${memberId}`}
                className={`text-sm leading-tight ${rpnDisabled ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
              >
                Fonds RPN
                {rpnDisabled && (
                  <span className='ml-1 text-xs'>— requiert le membership</span>
                )}
              </Label>
            </div>
            <span className={`text-sm font-semibold shrink-0 ${rpnDisabled ? 'text-muted-foreground' : ''}`}>
              {formatCurrency(rpnFee)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
