import { FamilyMemberState, BadgeProps } from '../FamilyMemberState'

export class ActiveState extends FamilyMemberState {
  constructor() {
    super('active')
  }

  isEditable(): boolean {
    return true
  }

  badgeProps(): BadgeProps {
    return { label: 'Actif' }
  }
}
