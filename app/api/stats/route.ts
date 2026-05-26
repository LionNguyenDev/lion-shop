import { NextResponse } from 'next/server'
import { getStats, Range } from '@/lib/services/statsService'

const VALID_RANGES: Range[] = ['today', '7d', '30d', '365d']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
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
