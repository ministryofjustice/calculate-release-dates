import dayjs from 'dayjs'
import _ from 'lodash'
import { SentenceDiagram, SentenceDiagramRow } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

type cell = {
  boxes?: box[]
  length: number
  empty: boolean
  start?: number
  end?: number
}
type box = {
  text: string
  colour?: 'blue' | 'red' | 'green'
}

export default class SentenceDiagramViewModel {
  private months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  public headers: {
    year: number
    month: string
  }[]

  constructor(public diagram: SentenceDiagram) {
    const earliestDate = _.min(this.diagram.rows.map(row => dayjs(row.sections[0].start)))
    const latestDate = _.max(_.flatten(this.diagram.rows.map(row => row.sections.map(section => dayjs(section.end)))))
    let month = earliestDate.month()
    let year = earliestDate.year()
    this.headers = [
      {
        year,
        month: this.months[month],
      },
    ]

    /* eslint-disable no-constant-condition */
    while (true) {
      if (month === 11) {
        month = 0
        year += 1
      } else {
        month += 1
      }
      this.headers.push({
        year,
        month: this.months[month],
      })
      if (month === latestDate.month() && year === latestDate.year()) {
        break
      }
    }
  }

  public cells(row: SentenceDiagramRow): cell[] {
    const cells: cell[] = []
    const { start } = row.sections[0]
    const { end } = row.sections[row.sections.length - 1]
    const startColumn = this.getColumnFromDate(start)
    const endColumn = this.getColumnFromDate(end)
    if (startColumn !== 0) {
      cells.push({
        length: startColumn,
        empty: true,
      })
    }
    // TODO this is just temporary.
    /* eslint-disable no-param-reassign */
    cells.push({
      boxes: row.sections.map(section => {
        let colour: 'blue' | 'red' | 'green' = 'green'
        if (!section.description) {
          colour = 'blue'
        } else if (section.description === 'Release date') {
          section.description = 'Custodial'
          colour = 'green'
        } else if (section.description === 'Expiry date') {
          section.description = 'Licence'
          colour = 'red'
        }
        return {
          colour,
          text: section.description,
        }
      }),
      length: endColumn - startColumn + 1,
      empty: false,
      start: getPercentWayThroughMonth(start),
      end: getPercentWayThroughMonth(end),
    })
    if (endColumn !== this.headers.length - 1) {
      cells.push({
        length: this.headers.length,
        empty: true,
      })
    }
    return cells
  }

  private getColumnFromDate(dateString: string): number {
    const date = dayjs(dateString)
    return this.headers.indexOf(
      this.headers.find(header => header.month === this.months[date.month()] && header.year === date.year())
    )
  }
}
function getPercentWayThroughMonth(dateString: string): number {
  const date = dayjs(dateString)
  const dayOfMonth = date.date()
  const daysInMonth = date.daysInMonth()
  const percentage = Math.floor((100 * dayOfMonth) / daysInMonth)
  return percentage
}
