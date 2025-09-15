import { FamilyMemberState, BadgeProps } from '../FamilyMemberState'

export class DeletedState extends FamilyMemberState {
  constructor() {
    super('deleted')
  }

  isEditable(): boolean {
    return false
  }

  badgeProps(): BadgeProps {
    return { label: 'Supprimé', variant: 'destructive' }
  }
}
