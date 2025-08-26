import { UserModel } from '../models/userModel'

export const softDeleteUser = async (userId: string, adminId: string) => {
  const user = await UserModel.findById(userId)
  if (!user) {
    throw new Error('User not found')
  }
  if (user.isAdmin) {
    throw new Error('Cannot delete admin')
  }
  const admin = await UserModel.findById(adminId)
  const adminName = admin
    ? `${admin.origines.firstName} ${admin.origines.lastName}`
    : 'unknown'

  user.deletedAt = new Date()
  user.deletedBy = adminName
  await user.save()
  return user
}
