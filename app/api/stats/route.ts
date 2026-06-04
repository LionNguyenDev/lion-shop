import { NextResponse } from 'next/server'
import { getStats, getStatsByDateRange, Range } from '@/lib/services/statsService'

const VALID_RANGES: Range[] = ['today', '7d', '30d', '365d']
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  // Custom date range mode
  if (from || to) {
    if (!from || !to || !ISO_RE.test(from) || !ISO_RE.test(to) || from > to) {
      return NextResponse.json(
        { error: 'Provide valid from and to (YYYY-MM-DD), from <= to' },
        { status: 400 },
      )
    }
    try {
      const stats = await getStatsByDateRange(from, to)
      return NextResponse.json(stats)
    } catch {
      return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
    }
  }

  // Preset range mode
  const rangeParam = searchParams.get('range') ?? '7d'
  if (!VALID_RANGES.includes(rangeParam as Range)) {
    return NextResponse.json(
      { error: 'Invalid range. Use one of: today, 7d, 30d, 365d' },
      { status: 400 },
    )
  }
  try {
    const stats = await getStats(rangeParam as Range)
    return NextResponse.json(stats)
  } catch {
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
