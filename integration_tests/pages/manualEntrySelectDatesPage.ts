import CommonSelectDatesToEnterPage from './commonSelectDatesToEnterPage'

export default class ManualEntrySelectDatesPage extends CommonSelectDatesToEnterPage {
  constructor() {
    super('manual-entry-select-dates')
  }

  public backLinkExistsWithTitle(href: string) {
    cy.contains('a', 'Back').should('have.attr', 'href').and('include', href)
  }
}
