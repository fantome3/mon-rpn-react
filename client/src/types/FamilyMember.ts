import { FamilyMemberState } from '../../../src/domain/familyMember/FamilyMemberState'

export type FamilyMember = {
  firstName: string
  lastName: string
  relationship: string
  state: FamilyMemberState
}
