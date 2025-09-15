import { FamilyMemberState, BadgeProps } from '../FamilyMemberState'

export class InactiveState extends FamilyMemberState {
  constructor() {
    super('inactive')
  }

  isEditable(): boolean {
    return true
  }

  badgeProps(): BadgeProps {
    return { label: 'Inactif', variant: 'outline' }
  }
}
