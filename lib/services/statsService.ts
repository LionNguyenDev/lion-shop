import dbConnect from '@/lib/db'
import Order from '@/models/Order'
import { statusOrders } from '@/lib/types'

export type Range = 'today' | '7d' | '30d' | '365d'
export type BucketFormat = 'hour' | 'day' | 'month'

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
  bucketFormat: BucketFormat
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

function rangeToBucketFormat(range: Range): BucketFormat {
  if (range === 'today') return 'hour'
  if (range === '365d')  return 'month'
  return 'day'
}

export async function getStats(range: Range): Promise<StatsResult> {
  await dbConnect()
  const w = buildWindow(range)

  const paidOnly = { $cond: [{ $eq: ['$status', statusOrders.PAID] }, 1, 0] }

  const groupStage = {
    _id: { $dateToString: { format: w.format, date: '$createdAt', timezone: TZ } },
    orders:  { $sum: 1 },
    revenue: { $sum: { $multiply: ['$totalAmount', paidOnly] } },
    profit:  { $sum: { $multiply: ['$profit',      paidOnly] } },
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
    bucketFormat: rangeToBucketFormat(range),
    current:  { ...summarize(currentBuckets),  buckets: currentBuckets },
    previous: { ...summarize(previousBuckets), buckets: previousBuckets },
  }
}

/** Generate expected bucket keys for an arbitrary date range. */
function expectedBucketsCustom(
  startLocalUTC: Date,
  endExcLocalUTC: Date,
  fmt: BucketFormat,
): string[] {
  const keys: string[] = []
  if (fmt === 'hour') {
    for (let h = 0; h < 24; h++) keys.push(String(h).padStart(2, '0'))
    return keys
  }
  if (fmt === 'month') {
    const cursor = new Date(Date.UTC(startLocalUTC.getUTCFullYear(), startLocalUTC.getUTCMonth(), 1))
    while (cursor.getTime() < endExcLocalUTC.getTime()) {
      const y = cursor.getUTCFullYear()
      const m = String(cursor.getUTCMonth() + 1).padStart(2, '0')
      keys.push(`${y}-${m}`)
      cursor.setUTCMonth(cursor.getUTCMonth() + 1)
    }
    return keys
  }
  const cursor = new Date(startLocalUTC)
  while (cursor.getTime() < endExcLocalUTC.getTime()) {
    const y = cursor.getUTCFullYear()
    const m = String(cursor.getUTCMonth() + 1).padStart(2, '0')
    const d = String(cursor.getUTCDate()).padStart(2, '0')
    keys.push(`${y}-${m}-${d}`)
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return keys
}

export async function getStatsByDateRange(fromISO: string, toISO: string): Promise<StatsResult> {
  await dbConnect()

  const [fy, fm, fd] = fromISO.split('-').map(Number)
  const [ty, tm, td] = toISO.split('-').map(Number)

  // UTC boundaries that correspond to VN midnight on each date
  const start   = new Date(Date.UTC(fy, fm - 1, fd)     - TZ_OFFSET_MS)
  const end     = new Date(Date.UTC(ty, tm - 1, td + 1) - TZ_OFFSET_MS) // exclusive end
  const spanMs  = end.getTime() - start.getTime()
  const spanDays = spanMs / (24 * 60 * 60 * 1000)

  const prevEnd   = start
  const prevStart = new Date(start.getTime() - spanMs)

  let bucketFormat: BucketFormat
  let format: string
  if (spanDays <= 1) {
    bucketFormat = 'hour'
    format = '%H'
  } else if (spanDays <= 90) {
    bucketFormat = 'day'
    format = '%Y-%m-%d'
  } else {
    bucketFormat = 'month'
    format = '%Y-%m'
  }

  // Local-date representations for expectedBucketsCustom (UTC values = local date values)
  const fromLocalUTC      = new Date(Date.UTC(fy, fm - 1, fd))
  const toExcLocalUTC     = new Date(Date.UTC(ty, tm - 1, td + 1))
  const prevFromLocalUTC  = new Date(fromLocalUTC.getTime() - spanMs)
  const prevToExcLocalUTC = fromLocalUTC

  const currentExpected  = expectedBucketsCustom(fromLocalUTC,     toExcLocalUTC,     bucketFormat)
  const previousExpected = expectedBucketsCustom(prevFromLocalUTC, prevToExcLocalUTC, bucketFormat)

  const paidOnly    = { $cond: [{ $eq: ['$status', statusOrders.PAID] }, 1, 0] }
  const groupStage  = {
    _id:     { $dateToString: { format, date: '$createdAt', timezone: TZ } },
    orders:  { $sum: 1 },
    revenue: { $sum: { $multiply: ['$totalAmount', paidOnly] } },
    profit:  { $sum: { $multiply: ['$profit',      paidOnly] } },
  }
  const projectStage = { _id: 0, bucket: '$_id', orders: 1, revenue: 1, profit: 1 }

  const [res] = await Order.aggregate<{ current: BucketRow[]; previous: BucketRow[] }>([
    { $match: { createdAt: { $gte: prevStart, $lt: end } } },
    {
      $facet: {
        current: [
          { $match: { createdAt: { $gte: start,     $lt: end     } } },
          { $group: groupStage }, { $project: projectStage }, { $sort: { bucket: 1 } },
        ],
        previous: [
          { $match: { createdAt: { $gte: prevStart, $lt: prevEnd } } },
          { $group: groupStage }, { $project: projectStage }, { $sort: { bucket: 1 } },
        ],
      },
    },
  ])

  const currentBuckets  = padBuckets(res?.current  ?? [], currentExpected)
  const previousBuckets = padBuckets(res?.previous ?? [], previousExpected)

  return {
    bucketFormat,
    current:  { ...summarize(currentBuckets),  buckets: currentBuckets },
    previous: { ...summarize(previousBuckets), buckets: previousBuckets },
  }
}
