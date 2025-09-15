export type BadgeProps = {
  label: string
  variant?: 'outline' | 'destructive'
}

export abstract class FamilyMemberState {
  constructor(public readonly name: 'active' | 'inactive' | 'deleted') {}
  abstract isEditable(): boolean
  abstract badgeProps(): BadgeProps
}
