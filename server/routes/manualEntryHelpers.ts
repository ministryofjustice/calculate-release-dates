import type { Request } from 'express'

export type RequestWithSession = Pick<Request, 'session'>

export interface ManualEntrySnapshot {
  selected: Array<{ dateType: string; value?: string }>
  reasonId: number
  otherReason?: string
}

export function getManualEntrySnapshot(req: RequestWithSession, nomsId: string): ManualEntrySnapshot {
  const selected = req.session.selectedManualEntryDates?.[nomsId] ?? []
  const reasonId = req.session.calculationReasonId?.[nomsId]
  const otherReason = req.session.otherReasonDescription?.[nomsId]

  if (!selected.length) throw Object.assign(new Error('No selectedManualEntryDates'), { status: 400 })
  if (reasonId == null) throw Object.assign(new Error('No calculationReasonId'), { status: 400 })

  return { selected, reasonId, otherReason }
}

export function clearRoutingFlag(req: RequestWithSession, nomsId: string): void {
  const list = req.session.manualEntryRoutingForBookings
  if (!Array.isArray(list)) return
  const i = list.findIndex(id => id === nomsId)
  if (i >= 0) list.splice(i, 1)
}

export function statusOf(err: unknown): number | undefined {
  if (typeof err === 'object' && err !== null) {
    const e = err as { response?: { status?: number }; status?: number }
    return e.response?.status ?? e.status
  }
  return undefined
}
