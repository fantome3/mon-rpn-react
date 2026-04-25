import { formatMonth } from './utils'
import { getTransactionStatusLabel } from './transactionStatus'

type MonthlySummaryItem = {
  _id: { month: number; year: number }
  total: number
  count: number
}

type StatusSummaryItem = {
  _id: string
  count: number
}

export type MonthlyChartPoint = {
  name: string
  montant: number
  transactions: number
  _month: number
}

export type StatusChartPoint = {
  name: string
  value: number
}

export const buildMonthlyChartData = (
  monthlySummary: MonthlySummaryItem[] | undefined
): MonthlyChartPoint[] => {
  if (!monthlySummary) return []

  return [...monthlySummary]
    .sort((a, b) =>
      a._id.year !== b._id.year
        ? a._id.year - b._id.year
        : a._id.month - b._id.month
    )
    .map((item) => ({
      name: formatMonth(item._id.month, item._id.year),
      montant: item.total,
      transactions: item.count,
      _month: item._id.month,
    }))
}

export const fillYearlyMonthlyData = (
  data: MonthlyChartPoint[],
  year: number
): MonthlyChartPoint[] =>
  Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    return (
      data.find((d) => d._month === month) ?? {
        name: formatMonth(month, year),
        montant: 0,
        transactions: 0,
        _month: month,
      }
    )
  })

export const buildStatusChartData = (
  statusSummary: StatusSummaryItem[] | undefined
): StatusChartPoint[] => {
  if (!statusSummary) return []

  return statusSummary.map((item) => ({
    name: getTransactionStatusLabel(item._id),
    value: item.count,
  }))
}
