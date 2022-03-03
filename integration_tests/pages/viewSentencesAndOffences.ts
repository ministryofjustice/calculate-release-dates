import { PageElement } from './page'
import ViewSentencesAndOffencesCommon from './sentencesAndOffencesCommon'

export default class ViewSentencesAndOffencesPage extends ViewSentencesAndOffencesCommon {
  constructor() {
    super('view-sentences-and-offences')
  }

  public static goTo(nomsId: string, calculationRequestId: number): ViewSentencesAndOffencesPage {
    cy.visit(`/view/${nomsId}/sentences-and-offences/${calculationRequestId}`)
    return new ViewSentencesAndOffencesPage()
  }

  public nextPage(): PageElement {
    return cy.get('[data-qa=next-page-button]')
  }
}
