import { statusOrders } from '@/lib/types'

/**
 * One source of truth for how an order status looks.
 *
 * These used to be hand-written emerald/red utility strings repeated in five files,
 * which drifted apart and didn't follow the theme in dark mode. They now go through the
 * `success` / `destructive` tokens, whose contrast is verified in both themes.
 */
interface StatusStyle {
  /** Small colour dot in front of a row */
  dot: string
  /** Outline badge (background + text + border) */
  badge: string
}

const SUCCESS_BADGE     = 'bg-success/10 text-success border-success/25'
const DESTRUCTIVE_BADGE = 'bg-destructive/10 text-destructive border-destructive/25'

export const orderStatusStyle: Record<string, StatusStyle> = {
  [statusOrders.PAID]:   { dot: 'bg-success',     badge: SUCCESS_BADGE },
  [statusOrders.UNPAID]: { dot: 'bg-destructive', badge: DESTRUCTIVE_BADGE },
}

/** Fallback keeps unknown statuses readable in both themes (the old one was light-only) */
export const NEUTRAL_BADGE = 'bg-muted text-muted-foreground border-border'

export const statusBadgeClass = (status: string) =>
  orderStatusStyle[status]?.badge ?? NEUTRAL_BADGE

export const statusDotClass = (status: string) =>
  orderStatusStyle[status]?.dot ?? 'bg-muted-foreground'

/** Shared badge sizing so every order badge matches (12px is the minimum readable size) */
export const BADGE_SIZE = 'text-xs font-semibold'

/** Restored-from-trash marker */
export const RESTORED_BADGE = SUCCESS_BADGE

/** Profit colouring: green when positive, red when negative, plain otherwise */
export const profitClass = (value: number) =>
  value > 0 ? 'text-success' : value < 0 ? 'text-destructive' : ''

/** Money, quantities and ids line up column-wise in the mono face */
export const NUMERIC = 'font-mono tabular-nums'
