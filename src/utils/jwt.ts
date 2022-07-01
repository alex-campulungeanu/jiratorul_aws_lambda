import { sign } from 'jsonwebtoken'

import { TokenPayload, TokenData, UserWithRoles } from '../interfaces/auth.interface';
import { JWT_SECRET } from '../configs/constants'

const createJWT = (user: UserWithRoles): TokenData => {
  const roles: string[] = user.roles.map(item => item.role.name)
  const dataStoredInToken: TokenPayload = { userPayload: { id: user.id, roles: roles}};
  const secretKey: string = JWT_SECRET;
  const expiresIn: number = 60 * 60;

  return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
}

const createCookie = (tokenData: TokenData): string => {
  return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
}

export { 
  createJWT, 
  createCookie
} 