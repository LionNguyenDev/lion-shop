import dbConnect from '@/lib/db'
import Order from '@/models/Order'
import { statusOrders } from '@/lib/types'

export type Range = 'today' | '7d' | '30d' | '365d'

export interface BucketRow {
  bucket: string
  orders: number
  revenue: number
  profit: number
}

export interface PeriodSummary {
  orders: number
  revenue: number
  profit: number
  buckets: BucketRow[]
}

export interface StatsResult {
  range: Range
  current: PeriodSummary
  previous: PeriodSummary
}

const TZ = 'Asia/Ho_Chi_Minh'
const TZ_OFFSET_MS = 7 * 60 * 60 * 1000

/** Start of "today" in Vietnam time, returned as a UTC Date. */
function startOfTodayVN(): Date {
  const nowVN = new Date(Date.now() + TZ_OFFSET_MS)
  const utcStart = Date.UTC(nowVN.getUTCFullYear(), nowVN.getUTCMonth(), nowVN.getUTCDate())
  return new Date(utcStart - TZ_OFFSET_MS)
}

interface Window {
  start: Date
  end: Date
  prevStart: Date
  prevEnd: Date
  format: string         // $dateToString format
}

function buildWindow(range: Range): Window {
  const now = new Date()

  if (range === 'today') {
    const start = startOfTodayVN()
    const lenMs = now.getTime() - start.getTime()
    return {
      start,
      end: now,
      prevStart: new Date(start.getTime() - 24 * 60 * 60 * 1000),
      prevEnd:   new Date(start.getTime() - 24 * 60 * 60 * 1000 + lenMs),
      format: '%H',
    }
  }

  const days = range === '7d' ? 7 : range === '30d' ? 30 : 365
  const startOfToday = startOfTodayVN()
  const start     = new Date(startOfToday.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
  const prevEnd   = start
  const prevStart = new Date(prevEnd.getTime() - days * 24 * 60 * 60 * 1000)

  return {
    start,
    end: now,
    prevStart,
    prevEnd,
    format: range === '365d' ? '%Y-%m' : '%Y-%m-%d',
  }
}

/** Generate all expected bucket keys between start and end (inclusive). */
function expectedBuckets(start: Date, end: Date, range: Range): string[] {
  const keys: string[] = []
  if (range === 'today') {
    const endHour = Math.floor((end.getTime() + TZ_OFFSET_MS) / (60 * 60 * 1000)) % 24
    for (let h = 0; h <= endHour; h++) keys.push(String(h).padStart(2, '0'))
    return keys
  }

  // Convert window edges to VN-local dates
  const startLocal = new Date(start.getTime() + TZ_OFFSET_MS)
  const endLocal   = new Date(end.getTime()   + TZ_OFFSET_MS)

  if (range === '365d') {
    const cursor = new Date(Date.UTC(startLocal.getUTCFullYear(), startLocal.getUTCMonth(), 1))
    const stop   = new Date(Date.UTC(endLocal.getUTCFullYear(),   endLocal.getUTCMonth(),   1))
    while (cursor.getTime() <= stop.getTime()) {
      const y = cursor.getUTCFullYear()
      const m = String(cursor.getUTCMonth() + 1).padStart(2, '0')
      keys.push(`${y}-${m}`)
      cursor.setUTCMonth(cursor.getUTCMonth() + 1)
    }
    return keys
  }

  // Daily
  const cursor = new Date(Date.UTC(startLocal.getUTCFullYear(), startLocal.getUTCMonth(), startLocal.getUTCDate()))
  const stop   = new Date(Date.UTC(endLocal.getUTCFullYear(),   endLocal.getUTCMonth(),   endLocal.getUTCDate()))
  while (cursor.getTime() <= stop.getTime()) {
    const y = cursor.getUTCFullYear()
    const m = String(cursor.getUTCMonth() + 1).padStart(2, '0')
    const d = String(cursor.getUTCDate()).padStart(2, '0')
    keys.push(`${y}-${m}-${d}`)
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return keys
}

/** Pad a raw bucket list so every expected bucket has a row (zeros if missing). */
function padBuckets(raw: BucketRow[], expected: string[]): BucketRow[] {
  const map = new Map(raw.map((r) => [r.bucket, r]))
  return expected.map(
    (key) => map.get(key) ?? { bucket: key, orders: 0, revenue: 0, profit: 0 },
  )
}

function summarize(buckets: BucketRow[]): Omit<PeriodSummary, 'buckets'> {
  return buckets.reduce(
    (acc, b) => {
      acc.orders  += b.orders
      acc.revenue += b.revenue
      acc.profit  += b.profit
      return acc
    },
    { orders: 0, revenue: 0, profit: 0 },
  )
}

export async function getStats(range: Range): Promise<StatsResult> {
  await dbConnect()
  const w = buildWindow(range)

  const groupStage = {
    _id: { $dateToString: { format: w.format, date: '$createdAt', timezone: TZ } },
    orders:  { $sum: 1 },
    revenue: { $sum: '$totalAmount' },
    profit:  { $sum: '$profit' },
  }

  const projectStage = {
    _id: 0,
    bucket:  '$_id',
    orders:  1,
    revenue: 1,
    profit:  1,
  }

  const [res] = await Order.aggregate<{
    current:  BucketRow[]
    previous: BucketRow[]
  }>([
    {
      $match: {
        status:    { $nin: [statusOrders.CANCELLED, statusOrders.FAILED] },
        createdAt: { $gte: w.prevStart, $lt: w.end },
      },
    },
    {
      $facet: {
        current: [
          { $match: { createdAt: { $gte: w.start, $lt: w.end } } },
          { $group: groupStage },
          { $project: projectStage },
          { $sort: { bucket: 1 } },
        ],
        previous: [
          { $match: { createdAt: { $gte: w.prevStart, $lt: w.prevEnd } } },
          { $group: groupStage },
          { $project: projectStage },
          { $sort: { bucket: 1 } },
        ],
      },
    },
  ])

  const currentExpected  = expectedBuckets(w.start,     w.end,     range)
  const previousExpected = expectedBuckets(w.prevStart, w.prevEnd, range)

  const currentBuckets  = padBuckets(res?.current  ?? [], currentExpected)
  const previousBuckets = padBuckets(res?.previous ?? [], previousExpected)

  return {
    range,
    current:  { ...summarize(currentBuckets),  buckets: currentBuckets },
    previous: { ...summarize(previousBuckets), buckets: previousBuckets },
  }
}
