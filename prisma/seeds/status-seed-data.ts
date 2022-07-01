import { Status } from '@prisma/client'

import { StatusTypeEnum } from '../../src/enums/status-type'

export const statusSeedData: Status[] = [
  {
    id: 1,
    name: StatusTypeEnum.NEW
  },
  {
    id: 2,
    name: StatusTypeEnum.IN_PROGRESS,
  },
  {
    id: 3,
    name: StatusTypeEnum.CLOSED,
  },
  {
    id: 4,
    name: StatusTypeEnum.POPULATED,
  }
]