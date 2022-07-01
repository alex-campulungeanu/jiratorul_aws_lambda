import { APIGatewayEvent, Callback, Context } from 'aws-lambda'
import { PrismaClient, User} from '@prisma/client'
import { compare } from 'bcrypt'
import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'

import { TokenData, UserWithRoles } from '../interfaces/auth.interface'
import { CreateUserDto, LoginUserDto } from '../dtos/auth.dto'
import { createJWT } from '../utils/jwt'
import { hashPassword } from '../utils/auth'

const prismaClient = new PrismaClient()

const login = middy(async (event: APIGatewayEvent, context: Context, callback: Callback) => {
  // await new Promise(resolve => setTimeout(resolve, 5000));
  const userData: LoginUserDto = JSON.parse(event.body)
  console.log(`[+] Login user: ${userData.email}`)
  const findUser: UserWithRoles  = await prismaClient.user.findUnique({
    where:{
      email: userData.email
    },
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  })
  if (!findUser) {
    return {
      body: JSON.stringify(`User ${userData.email} not found`),
      statusCode: 401,
    }
  }
  const isPasswordMatching: boolean = await compare(userData.password, findUser.password)
  if (!isPasswordMatching) {
    return {
      body: JSON.stringify(`Wrong authentification user/password`),
      statusCode: 401,
    }
  }
  const token: TokenData = createJWT(findUser)
  const nameRoles = findUser.roles.map(role => role.role.name)
  const returnedUser = {
    id: findUser.id,
    name: findUser.name,
    email: findUser.email,
    roles: nameRoles,
  }
  return {
    body: JSON.stringify({token: token.token, user: returnedUser}),
    statusCode: 200,
    // headers: {
    //   'Access-Control-Allow-Origin': '*',
    //   'Access-Control-Allow-Credentials': true,
    // },
  }
})
  .use(cors())
  .use(httpErrorHandler())

const signup = middy(async (event: APIGatewayEvent, context: Context, callback: Callback) => {
  const userData: CreateUserDto = JSON.parse(event.body)
  const findUser: User = await prismaClient.user.findUnique({ where: { email: userData.email } });
  if (findUser) {
    return {
      body: JSON.stringify(`You're email ${userData.email} already exists`),
      statusCode: 400,
    }
  }
  const hashedPassword = await hashPassword(userData.password);
  const createUserData: User = await prismaClient.user.create({ data: { ...userData, password: hashedPassword } });
  const returnedData = {
    id: createUserData.id,
    name: createUserData.name,
    email: createUserData.email,
  }
  return {
    body: JSON.stringify(returnedData),
    statusCode: 200,
  }
})
  .use(cors())
  .use(httpErrorHandler())

export { login, signup }