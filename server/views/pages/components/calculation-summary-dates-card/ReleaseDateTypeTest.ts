/* This class is imported and created based on the ReleaseDateType enum in the CRD-Api. This is to ensure that
there aren't any types that are missed when creating the CalculationSummaryDatesCardModel -filteredListOfDates array.
The commented out types are not used in the CalculationSummaryDatesCardModel and are therefore not included in the ReleaseDateType class.
*/
// eslint-disable-next-line import/prefer-default-export
export class ReleaseDateType {
  description: string

  constructor(description) {
    this.description = description
  }

  static CRD = new ReleaseDateType('Conditional release date')

  static LED = new ReleaseDateType('Licence expiry date')

  static SED = new ReleaseDateType('Sentence expiry date')

  static NPD = new ReleaseDateType('Non-parole date')

  static ARD = new ReleaseDateType('Automatic release date')

  static TUSED = new ReleaseDateType('Top up supervision expiry date')

  static PED = new ReleaseDateType('Parole eligibility date')

  static SLED = new ReleaseDateType('Sentence and licence expiry date')

  static HDCED = new ReleaseDateType('Home detention curfew eligibility date')

  // static NCRD = new ReleaseDateType('Notional conditional release date')

  static ETD = new ReleaseDateType('Early transfer date')

  static MTD = new ReleaseDateType('Mid transfer date')

  static LTD = new ReleaseDateType('Late transfer date')

  static DPRRD = new ReleaseDateType('Detention and training order post recall release date')

  static PRRD = new ReleaseDateType('Post recall release date')

  // static ESED = new ReleaseDateType('Effective sentence end date')

  static ERSED = new ReleaseDateType('Early removal scheme eligibility date')

  static TERSED = new ReleaseDateType('Tariff-expired removal scheme eligibility date')

  static APD = new ReleaseDateType('Approved parole date')

  static HDCAD = new ReleaseDateType('Home detention curfew approved date')

  // static None = new ReleaseDateType('None of the above dates apply')

  static Tariff = new ReleaseDateType('known as the Tariff expiry date')

  static ROTL = new ReleaseDateType('Release on temporary licence')

  // static HDCED4PLUS = new ReleaseDateType('HDCED4+')
}
