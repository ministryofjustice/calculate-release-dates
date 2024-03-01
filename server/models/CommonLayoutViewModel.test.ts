import CommonLayoutViewModel from './CommonLayoutViewModel'
import CommonElementConfig from './CommonElementConfig'
import { PrisonAPIAssignedLivingUnit, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

describe('CommonLayoutViewModel', () => {
  it('produces common view model config without prisoner details', () => {
    const model = new CommonLayoutViewModel()
    const expectedConfig: CommonElementConfig = {
      environment: 'prod',
      prisonNumber: undefined,
      serviceHeader: { environment: 'prod', prisonNumber: undefined },
      miniProfile: undefined,
    }
    expect(model.commonElementConfig).toStrictEqual(expectedConfig)
  })
  it('produces common view model config with prisoner details', () => {
    const prisonerDetail: PrisonApiPrisoner = {
      offenderNo: 'ABC123',
      firstName: 'Anon',
      lastName: 'Nobody',
      dateOfBirth: '2000-06-20',
      status: 'ACTIVE IN',
      assignedLivingUnit: {
        agencyName: 'Foo Prison (HMP)',
        description: 'D-2-003',
      } as PrisonAPIAssignedLivingUnit,
    }
    const model = new CommonLayoutViewModel(prisonerDetail)
    const expectedConfig: CommonElementConfig = {
      environment: 'prod',
      prisonNumber: 'ABC123',
      serviceHeader: { environment: 'prod', prisonNumber: 'ABC123' },
      miniProfile: {
        person: {
          prisonerNumber: 'ABC123',
          firstName: 'Anon',
          lastName: 'Nobody',
          dateOfBirth: '2000-06-20',
          status: 'ACTIVE IN',
          prisonName: 'Foo Prison (HMP)',
          cellLocation: 'D-2-003',
        },
        profileUrl: '/prisoner/ABC123',
        imageUrl: '/prisoner/ABC123/image',
      },
    }
    expect(model.commonElementConfig).toStrictEqual(expectedConfig)
  })
  it('produces common view model config with prisoner details that has no location', () => {
    const prisonerDetail: PrisonApiPrisoner = {
      offenderNo: 'ABC123',
      firstName: 'Anon',
      lastName: 'Nobody',
      dateOfBirth: '2000-06-20',
      status: 'ACTIVE IN',
    }
    const model = new CommonLayoutViewModel(prisonerDetail)
    const expectedConfig: CommonElementConfig = {
      environment: 'prod',
      prisonNumber: 'ABC123',
      serviceHeader: { environment: 'prod', prisonNumber: 'ABC123' },
      miniProfile: {
        person: {
          prisonerNumber: 'ABC123',
          firstName: 'Anon',
          lastName: 'Nobody',
          dateOfBirth: '2000-06-20',
          status: 'ACTIVE IN',
          prisonName: undefined,
          cellLocation: undefined,
        },
        profileUrl: '/prisoner/ABC123',
        imageUrl: '/prisoner/ABC123/image',
      },
    }
    expect(model.commonElementConfig).toStrictEqual(expectedConfig)
  })
})
