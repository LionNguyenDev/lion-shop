import mongoose, { type Document, type Model, Schema } from 'mongoose'

export type UserRole = 'admin' | 'staff'

export interface IUser extends Document {
  name: string
  username: string
  password: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

const UserSchema: Schema = new Schema(
  {
    name:     { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3 },
    password: { type: String, required: true, minlength: 6 },
    role:     { type: String, enum: ['admin', 'user'], default: 'user' },
  },
  { timestamps: true },
)

// Always recreate the cached model so schema changes take effect in dev
if (mongoose.models.User) {
  delete (mongoose.models as Record<string, unknown>)['User']
}
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema)

export default User
