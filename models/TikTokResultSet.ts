import mongoose, { type Document, type Model, Schema } from 'mongoose'
import { TIKTOK_RESULTS_TTL } from '@/lib/types'

export type TikTokResultStatus = 'pending' | 'done' | 'error'

export interface ITikTokResultRow {
  url: string
  status: TikTokResultStatus
  // followers is optional: tables saved before it was tracked don't have it
  stats?: { followers?: number; views: number; likes: number; comments: number; favorites: number; shares: number }
  error?: string
}

/** The results table of one user's latest TikTok run, so it survives reloads and new sessions */
export interface ITikTokResultSet extends Document {
  userId: mongoose.Types.ObjectId
  rows: ITikTokResultRow[]
  savedAt: Date
}

const StatsSchema = new Schema(
  {
    followers: { type: Number, required: false },
    views:     { type: Number, required: true },
    likes:     { type: Number, required: true },
    comments:  { type: Number, required: true },
    favorites: { type: Number, required: true },
    shares:    { type: Number, required: true },
  },
  { _id: false },
)

const RowSchema = new Schema(
  {
    url:    { type: String, required: true },
    status: { type: String, enum: ['pending', 'done', 'error'], required: true },
    stats:  { type: StatsSchema, required: false },
    error:  { type: String, required: false },
  },
  { _id: false },
)

const TikTokResultSetSchema: Schema = new Schema({
  userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  rows:    { type: [RowSchema], default: [] },
  savedAt: { type: Date, required: true, default: Date.now },
})

// MongoDB deletes the table TIKTOK_RESULTS_TTL after it was last saved
TikTokResultSetSchema.index({ savedAt: 1 }, { expireAfterSeconds: TIKTOK_RESULTS_TTL })

const TikTokResultSet: Model<ITikTokResultSet> =
  (mongoose.models.TikTokResultSet as Model<ITikTokResultSet>) ??
  mongoose.model<ITikTokResultSet>('TikTokResultSet', TikTokResultSetSchema)

export default TikTokResultSet
