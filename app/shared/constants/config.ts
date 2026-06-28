import { formatMoney } from '@/shared/utils/money'

export const APP_CONFIG = {
  DATE_FORMAT: 'DD/MM/YYYY',
  UNIT: 'cá',
  DEFAULT_PLAYER_PREFIX: 'Người chơi',
  BORDER_COLORS: ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'],
}

export const formatCa = (amount: number) =>
  `${formatMoney(amount)} ${APP_CONFIG.UNIT}`

export { formatMoney } from '@/shared/utils/money'
