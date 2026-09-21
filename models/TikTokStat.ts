import mongoose, { type Document, type Model, Schema } from 'mongoose'
import { TIKTOK_CACHE_TTL } from '@/lib/types'

export interface ITikTokStat extends Document {
  videoId: string
  views: number
  likes: number
  comments: number
  favorites: number
  shares: number
  fetchedAt: Date
}

const TikTokStatSchema: Schema = new Schema({
  videoId:   { type: String, required: true, unique: true },
  views:     { type: Number, required: true },
  likes:     { type: Number, required: true },
  comments:  { type: Number, required: true },
  favorites: { type: Number, required: true },
  shares:    { type: Number, required: true },
  fetchedAt: { type: Date, required: true, default: Date.now },
})

// MongoDB drops cached docs automatically once they expire
TikTokStatSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: TIKTOK_CACHE_TTL })

const TikTokStat: Model<ITikTokStat> =
  (mongoose.models.TikTokStat as Model<ITikTokStat>) ?? mongoose.model<ITikTokStat>('TikTokStat', TikTokStatSchema)

export default TikTokStat
