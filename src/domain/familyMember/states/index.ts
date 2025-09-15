import { ActiveState } from './ActiveState'
import { InactiveState } from './InactiveState'
import { DeletedState } from './DeletedState'

export { ActiveState, InactiveState, DeletedState }

export const stateFromName = (
  name: 'active' | 'inactive' | 'deleted',
) => {
  switch (name) {
    case 'inactive':
      return new InactiveState()
    case 'deleted':
      return new DeletedState()
    case 'active':
    default:
      return new ActiveState()
  }
}
