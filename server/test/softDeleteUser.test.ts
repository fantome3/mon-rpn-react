import { test, strictEqual, ok } from 'node:test'
import { softDeleteUser } from '../src/services/userService'
import { UserModel } from '../src/models/userModel'

test('softDeleteUser marks user with date and admin name', async () => {
  const user: any = {
    isAdmin: false,
    saveCalled: false,
    save: async function () {
      this.saveCalled = true
      return this
    },
  }
  const admin: any = {
    origines: { firstName: 'Admin', lastName: 'Test' },
  }
  const originalFindById = UserModel.findById
  ;(UserModel.findById as any) = async (id: string) => {
    if (id === 'user') return user
    if (id === 'admin') return admin
    return null
  }
  await softDeleteUser('user', 'admin')
  ok(user.deletedAt instanceof Date)
  strictEqual(user.deletedBy, 'Admin Test')
  strictEqual(user.saveCalled, true)
  UserModel.findById = originalFindById
})
