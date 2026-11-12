import buildPagination from './paginationUtils'

const hrefFor = (page: number) => `/x?page=${page}`

describe('buildPagination', () => {
  it('shows a single page with no page links but still reports the total', () => {
    const result = buildPagination({
      currentPage: 1,
      totalPages: 1,
      pageSize: 10,
      totalElements: 3,
      hrefFor,
      text: 'runs',
    })

    expect(result.items).toEqual([])
    expect(result.previous).toBeUndefined()
    expect(result.next).toBeUndefined()
    expect(result.results).toEqual({ from: 1, to: 3, count: 3, text: 'runs' })
  })

  it('reports no results range when there are none', () => {
    const result = buildPagination({
      currentPage: 1,
      totalPages: 0,
      pageSize: 10,
      totalElements: 0,
      hrefFor,
      text: 'runs',
    })

    expect(result.results).toEqual({ from: 0, to: 0, count: 0, text: 'runs' })
  })

  it('shows every page number when there are few pages', () => {
    const result = buildPagination({
      currentPage: 2,
      totalPages: 3,
      pageSize: 10,
      totalElements: 25,
      hrefFor,
      text: 'runs',
    })

    expect(result.items).toEqual([
      { text: '1', href: '/x?page=1', selected: false },
      { text: '2', href: '/x?page=2', selected: true },
      { text: '3', href: '/x?page=3', selected: false },
    ])
    expect(result.previous).toEqual({ href: '/x?page=1', text: 'Previous' })
    expect(result.next).toEqual({ href: '/x?page=3', text: 'Next' })
    expect(result.results).toEqual({ from: 11, to: 20, count: 25, text: 'runs' })
  })

  it('collapses distant pages into dots and always keeps first and last', () => {
    const result = buildPagination({
      currentPage: 5,
      totalPages: 9,
      pageSize: 10,
      totalElements: 90,
      hrefFor,
      text: 'runs',
    })

    expect(result.items.map(i => i.type ?? i.text)).toEqual(['1', 'dots', '4', '5', '6', 'dots', '9'])
  })

  it('has no next link on the last page and a short final range', () => {
    const result = buildPagination({
      currentPage: 3,
      totalPages: 3,
      pageSize: 10,
      totalElements: 25,
      hrefFor,
      text: 'runs',
    })

    expect(result.next).toBeUndefined()
    expect(result.results).toEqual({ from: 21, to: 25, count: 25, text: 'runs' })
  })
})
