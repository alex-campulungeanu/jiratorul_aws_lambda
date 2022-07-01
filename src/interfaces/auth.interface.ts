import { Prisma } from '.prisma/client';
import { PolicyDocument } from 'aws-lambda'
import { JwtPayload } from 'jsonwebtoken';

export interface PolicyResponse {
  context: {
    user: any
  },
  principalId: number,
  policyDocument: PolicyDocument
}

export interface TokenPayload extends JwtPayload {
  userPayload: {
    id: number,
    roles: string[]
  }
}

export interface DataStoredInToken {
  id: number;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

const userWithRoles = Prisma.validator<Prisma.UserArgs>() ({
  include: {
    roles: {
      include: {
        role: true
      }
    }
  }
})

export type UserWithRoles = Prisma.UserGetPayload<typeof userWithRoles>