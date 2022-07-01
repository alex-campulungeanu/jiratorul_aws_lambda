import { Role } from '@prisma/client'

import { RoleTypeEnum } from '../../src/enums/role-type'

export const roleSeedData: Role[] = [
  {
    id: 1,
    name: RoleTypeEnum.ADMIN,
    description: ''
  },
  {
    id: 2,
    name: RoleTypeEnum.BOSS,
    description: ''
  },
  {
    id: 3,
    name: RoleTypeEnum.DEVELOPER,
    description: ''
  }
]