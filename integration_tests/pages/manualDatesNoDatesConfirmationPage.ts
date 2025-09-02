import Page, { PageElement } from './page'

export default class ManualDatesNoDatesConfirmationPage extends Page {
  constructor() {
    super('indeterminate-no-dates-confirmation')
  }

  public confirm = (): PageElement => cy.get('[id=no-date-selection]').click()

  public continue = (): PageElement => cy.get('[data-qa=no-date-selection]').click()
}
