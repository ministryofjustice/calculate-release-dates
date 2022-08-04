import { PageElement } from './page'
import ViewSentencesAndOffencesCommon from './sentencesAndOffencesCommon'

export default class CheckInformationPage extends ViewSentencesAndOffencesCommon {
  constructor() {
    super('check-information')
  }

  public static goTo(prisonerId: string): CheckInformationPage {
    cy.visit(`/calculation/${prisonerId}/check-information`)
    return new CheckInformationPage()
  }

  public calculateButton(): PageElement {
    return cy.get('[data-qa=calculate-release-dates]')
  }
}
