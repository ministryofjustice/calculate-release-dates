export interface PaginationItem {
  text?: string
  href?: string
  selected?: boolean
  type?: string
}

interface PaginationOptions {
  currentPage: number // 1 based
  totalPages: number
  pageSize: number
  totalElements: number
  hrefFor: (page: number) => string
  text: string
}

const buildItems = ({ currentPage, totalPages, hrefFor }: PaginationOptions): PaginationItem[] => {
  if (totalPages <= 1) {
    return []
  }
  const pagesToShow = new Set<number>([1, totalPages, currentPage])
  if (currentPage > 1) pagesToShow.add(currentPage - 1)
  if (currentPage < totalPages) pagesToShow.add(currentPage + 1)

  const items: PaginationItem[] = []
  let previousPage = 0
  ;[...pagesToShow]
    .sort((a, b) => a - b)
    .forEach(page => {
      if (page - previousPage > 1) {
        items.push({ type: 'dots' })
      }
      items.push({ text: page.toString(), href: hrefFor(page), selected: page === currentPage })
      previousPage = page
    })
  return items
}

export default function buildPagination(options: PaginationOptions) {
  const { currentPage, totalPages, pageSize, totalElements, hrefFor, text } = options
  const from = totalElements > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const to = Math.min(currentPage * pageSize, totalElements)
  return {
    items: buildItems(options),
    previous: currentPage > 1 ? { href: hrefFor(currentPage - 1), text: 'Previous' } : undefined,
    next: currentPage < totalPages ? { href: hrefFor(currentPage + 1), text: 'Next' } : undefined,
    results: { from, to, count: totalElements, text },
  }
}

export const parsePage = (value: unknown): number => {
  const page = Number.parseInt(value as string, 10)
  return Number.isNaN(page) ? 1 : Math.max(1, page)
}
