import { Sprint, UserSprint } from '@prisma/client'
import { APIGatewayEvent, Callback, Context} from 'aws-lambda'
import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
// import validator from '@middy/validator'
// import jsonBodyParser from "@middy/http-json-body-parser";

import createPrismaClient from '../lib/prismaClient'
import { UpdateDetailsDto, UpdateUserDetailsDto } from '../dtos/sprint.dto'
// import { updateDetailsSchema } from '../schemas/sprint'

const prisma = createPrismaClient()

const updateDetails = middy(async(event: APIGatewayEvent, context: Context, callback: Callback) => {
  const detailsBody: UpdateDetailsDto= JSON.parse(event.body)
  const id = parseInt(event.pathParameters.sprintId)
  const findSprint = await prisma.sprint.findUnique({where: {id: id}})
  if (!findSprint) {
    return {
      body: JSON.stringify(`Sprint wity id ${id} not found`),
      statusCode: 404
    };
  }
  const updatedSprint: Sprint = await prisma.sprint.update({
    where: {
      id: id
    },
    data: {
      // TODO: should get ride of the parseInt
      bankHolidays: parseInt(detailsBody.bankHolidays),
    }
  })
  return {
    body: JSON.stringify(updatedSprint),
    statusCode: 200,
  };
})
  .use(cors())
  // .use(jsonBodyParser())
  // .use(validator({inputSchema: updateDetailsSchema}))
  .use(httpErrorHandler())

const updateUserDetails = middy(async(event: APIGatewayEvent, context: Context, callback: Callback) => {
  const detailsBody: UpdateUserDetailsDto= JSON.parse(event.body)
  const sprintId = parseInt(event.pathParameters.sprintId)
  const userId = parseInt(event.pathParameters.userId)
  const updateSprint: UserSprint = await prisma.userSprint.update({
    where: {
      userId_sprintId: {
        sprintId: sprintId,
        userId: userId,
      }
    },
    data: {
      // TODO: should get ride of the parseInt
      vacationDays: detailsBody.vacationDays,
      feedbackWeeks:detailsBody.feedbackWeeks,
      completed: true
    }
  })
  return {
    body: JSON.stringify(updateSprint),
    statusCode: 200,
    headers: {
      /* Required for CORS support to work */
      'Access-Control-Allow-Origin': '*',
       /* Required for cookies, authorization headers with HTTPS */
      'Access-Control-Allow-Credentials': true,
    },
  };
})
  .use(cors())
  .use(httpErrorHandler())

export {
  updateDetails,
  updateUserDetails,
}