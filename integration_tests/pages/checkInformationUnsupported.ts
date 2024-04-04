import { PageElement } from './page'
import ViewSentencesAndOffencesCommon from './sentencesAndOffencesCommon'

export default class CheckInformationUnsupportedPage extends ViewSentencesAndOffencesCommon {
  constructor() {
    super('check-information-unsupported')
  }

  public manualEntryButton(): PageElement {
    return cy.get('[data-qa=manual-entry]')
  }
}
