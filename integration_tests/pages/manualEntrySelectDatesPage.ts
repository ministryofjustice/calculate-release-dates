import CommonSelectDatesToEnterPage from './commonSelectDatesToEnterPage'

export default class ManualEntrySelectDatesPage extends CommonSelectDatesToEnterPage {
  constructor() {
    super('manual-entry-select-dates')
  }

  public backLinkExistsWithTitle(href: string) {
    cy.contains('a', 'Back') // Finds <a> with exact text "Back"
      .should('have.attr', 'href') // Asserts that href attribute exists
      .and('include', href) // Replace with the expected href value
  }
}
