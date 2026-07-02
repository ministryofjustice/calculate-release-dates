import ComparisonResultMismatchDetailModel from './ComparisonResultMismatchDetailModel'
import { ComparisonPersonOverview } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

describe('ComparisonResultMismatchDetailModel', () => {
  describe('show correct label for mismatch', () => {
    const baseDatesMismatch: ComparisonPersonOverview = {
      personId: 'A1234BC',
      lastName: 'Test',
      isValid: true,
      isMatch: false,
      hasDiscrepancyRecord: false,
      mismatchType: 'RELEASE_DATES_MISMATCH',
      validationMessages: [],
      shortReference: 'a1',
      bookingId: 2,
      calculatedAt: '2000-01-01',
      crdsDates: {},
      nomisDates: {},
      overrideDates: {},
      breakdownByReleaseDateType: {},
      sdsSentencesIdentified: [],
    }
    it('should show TUSED as not applicable', () => {
      const model = new ComparisonResultMismatchDetailModel({
        ...baseDatesMismatch,
        crdsDates: {},
        nomisDates: { TUSED: '2025-01-02' },
      })
      const row = model.dates.find(
        (date: ({ text: string } | { html: string })[]) => 'text' in date[0] && date[0].text === 'TUSED',
      )
      expect((row[1] as { html: string }).html).toContain('Not Applicable')
    })

    it('should show match if no override and crds and nomis match', () => {
      const model = new ComparisonResultMismatchDetailModel({
        ...baseDatesMismatch,
        crdsDates: { CRD: '2025-01-02' },
        nomisDates: { CRD: '2025-01-02' },
      })
      const row = model.dates.find(
        (date: ({ text: string } | { html: string })[]) => 'text' in date[0] && date[0].text === 'CRD',
      )
      expect((row[1] as { html: string }).html).toContain('Match')
    })

    it('should show match if override and crds match', () => {
      const model = new ComparisonResultMismatchDetailModel({
        ...baseDatesMismatch,
        crdsDates: { CRD: '2025-01-03' },
        nomisDates: { CRD: '2025-01-02' },
        overrideDates: { CRD: '2025-01-03' },
      })
      const row = model.dates.find(
        (date: ({ text: string } | { html: string })[]) => 'text' in date[0] && date[0].text === 'CRD',
      )
      expect((row[1] as { html: string }).html).toContain('Match')
    })

    it('should show mismatch if crds present but nomis and override missing', () => {
      const model = new ComparisonResultMismatchDetailModel({
        ...baseDatesMismatch,
        crdsDates: { CRD: '2025-01-02' },
        nomisDates: { CRD: '' },
        overrideDates: { CRD: '' },
      })
      const row = model.dates.find(
        (date: ({ text: string } | { html: string })[]) => 'text' in date[0] && date[0].text === 'CRD',
      )
      expect((row[1] as { html: string }).html).toContain('Mismatch')
    })

    it('should show mismatch if nomis present but crds and override missing', () => {
      const model = new ComparisonResultMismatchDetailModel({
        ...baseDatesMismatch,
        crdsDates: { CRD: '2025-01-02' },
        nomisDates: { CRD: '' },
        overrideDates: { CRD: '' },
      })
      const row = model.dates.find(
        (date: ({ text: string } | { html: string })[]) => 'text' in date[0] && date[0].text === 'CRD',
      )
      expect((row[1] as { html: string }).html).toContain('Mismatch')
    })

    it('should show mismatch if override present but crds and nomis missing', () => {
      const model = new ComparisonResultMismatchDetailModel({
        ...baseDatesMismatch,
        overrideDates: { CRD: '2025-01-02' },
      })
      const row = model.dates.find(
        (date: ({ text: string } | { html: string })[]) => 'text' in date[0] && date[0].text === 'CRD',
      )
      expect((row[1] as { html: string }).html).toContain('Mismatch')
    })

    it('should show no match if nomis and crds do not match', () => {
      const model = new ComparisonResultMismatchDetailModel({
        ...baseDatesMismatch,
        crdsDates: { CRD: '2025-01-03' },
        nomisDates: { CRD: '2025-01-02' },
      })
      const row = model.dates.find(
        (date: ({ text: string } | { html: string })[]) => 'text' in date[0] && date[0].text === 'CRD',
      )
      expect((row[1] as { html: string }).html).toContain('Mismatch')
    })

    it('should show no match if override and crds do not match', () => {
      const model = new ComparisonResultMismatchDetailModel({
        ...baseDatesMismatch,
        crdsDates: { CRD: '2025-01-03' },
        nomisDates: { CRD: '2025-01-02' },
        overrideDates: { CRD: '2025-01-04' },
      })
      const row = model.dates.find(
        (date: ({ text: string } | { html: string })[]) => 'text' in date[0] && date[0].text === 'CRD',
      )
      expect((row[1] as { html: string }).html).toContain('Mismatch')
    })
  })
})
