import { hash } from 'bcrypt'

import { RoleTypeEnum } from '../enums/role-type'

interface AuthMappingsInterface {
  resourcePath: string,
  method: string,
  roles: Array<string>
}

const authMappings: AuthMappingsInterface[] = [
  {
    resourcePath: "/sprint/{sprintId}",
    method: "PATCH",
    roles: [RoleTypeEnum.ADMIN]
  },
  {
    resourcePath: "/report/populate/{id}",
    method: "POST",
    roles: [RoleTypeEnum.ADMIN]
  },
  {
    resourcePath: "/sprint-user/{sprintId}/user/{userId}",
    method: "PATCH",
    roles: [RoleTypeEnum.DEVELOPER, RoleTypeEnum.ADMIN]
  },
];

const checkPermissions = (roles: string[], resourcePath: string, method: string) => {
  const authMapping = authMappings.find( item => item.resourcePath === resourcePath && item.method === method)
  if ( authMapping != null) {
    if ( authMapping.roles == null || authMapping.roles.length === 0) {
      return true
    }
    if (roles === null) {
      return false
    }
    const valid = authMapping.roles.some(role => roles.indexOf(role) !== -1)
    return valid
  }
  return false
}

const hashPassword = async (pass: string) => {
  const hashed = await hash(pass, 10);
  return hashed
}

export {
  hashPassword,
  checkPermissions
}