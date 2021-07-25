import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'

const user = {
  name: 'john smith',
  firstName: 'john',
  lastName: 'smith',
  username: 'user1',
  displayName: 'John Smith',
}

export default class MockCalculateReleaseDatesService extends CalculateReleaseDatesService {
  constructor() {
    super(undefined)
  }

  async getData(token: string) {
    return {
      token,
      ...user,
    }
  }
}
