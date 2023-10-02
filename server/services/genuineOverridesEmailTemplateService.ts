import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import config from '../config'

export default class GenuineOverridesEmailTemplateService {
  public getIncorrectCalculationEmail(
    calculationReference: string,
    prisonerDetail: PrisonApiPrisoner,
    calculationId: number
  ): string {
    return `
Query ref: ${calculationReference}%0D
%0D
Hello,%0D
%0D
You contacted the specialist support team to query the dates calculated by the Calculate release dates service (CRDS). %0D
%0D
The calculation was for:%0D
${prisonerDetail.firstName} ${prisonerDetail.lastName}.%0D
Prisoner ID: ${prisonerDetail.offenderNo}%0D
%0D
The team can confirm that the release dates calculated by the service were incorrect.%0D 
%0D
The correct release dates for this prisoner have been submitted. You can view the calculation in the calculation look up service by clicking this link, or copying and pasting it into your browser: ${config.domain}/view/${prisonerDetail.offenderNo}/calculation-summary/${calculationId}.%0D 
%0D
[Add any details that could help explain the mismatch in the calculated dates]%0D
%0D
Thank you for raising this error in the Calculate release dates service. It has been logged and will be added to our list of continuous improvements.%0D 
%0D
Should you have any further questions, please get in touch.%0D
%0D
Kind regards,%0D
%0D
The Specialist support team%0D
`
  }

  public getCorrectCalculationEmail(
    calculationReference: string,
    prisonerDetail: PrisonApiPrisoner,
    calculationId: number
  ): string {
    return `
Query ref: ${calculationReference}%0D
%0D
Hello,%0D
%0D
You contacted the specialist support team to query the dates calculated by the Calculate release dates service (CRDS).%0D
%0D
The calculation was for:%0D
${prisonerDetail.firstName} ${prisonerDetail.lastName}.%0D
Prisoner ID: ${prisonerDetail.offenderNo}%0D
%0D
The team can confirm that the release dates calculated by the service were correct.%0D
%0D
The final release dates for this prisoner have been submitted. You can view the calculation in the calculation look up service by clicking this link, or copying and pasting it into your browser: ${config.domain}/view/${prisonerDetail.offenderNo}/calculation-summary/${calculationId}.%0D 
%0D
An explanation of the discrepancy can be found below:%0D
%0D
[Explain why the OMU calculation was incorrect]%0D
%0D
[Add any supporting documentation or information]%0D
%0D
Should you have any further questions, please get in touch.%0D
%0D
Kind regards,%0D
%0D
The Specialist support team%0D
`
  }
}
