import { APIGatewayEvent, Callback, Context } from "aws-lambda"
import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'

import createPrismaClient from '../lib/prismaClient'

const prisma = createPrismaClient()

// use this route to ping database time to time so it show it is used
const index = middy(async (event: APIGatewayEvent, context: Context, callback: Callback) => {
  const findAllStatus = await prisma.status.findMany()
  console.log(findAllStatus)
  return {
    body: JSON.stringify('Sanity check ok'),
    statusCode: 200,
    // headers: {
    //   'Access-Control-Allow-Origin': '*',
    //   'Access-Control-Allow-Credentials': true,
    // },
  }
})
  .use(cors())
  .use(httpErrorHandler())

// const indexMiddy = middy(index)
//   .use(cors())

export { index }