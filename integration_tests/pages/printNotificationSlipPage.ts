import Page from './page'

export default class PrintNotificationSlipPage extends Page {
  constructor() {
    super('print-notification-slip')
  }

  public clickBack(): PrintNotificationSlipPage {
    cy.get('.govuk-back-link').click()
    return this
  }
}
