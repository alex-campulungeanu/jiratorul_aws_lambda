import { Report, Sprint } from '@prisma/client'
import { APIGatewayEvent, Callback, Context} from 'aws-lambda'
import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'

import createPrismaClient from '../lib/prismaClient'
import { CreateReportDto } from '../dtos/report.dto'
import { RoleTypeEnum } from '../enums/role-type'
import { fetchJiraDetails, mapJiraTypeToIssueType } from '../utils/jira'
import { addSprint } from '../utils/report'
import { ReturnedDataInterface } from '../interfaces/jira.interface'
import { NewSprintPayloadInterface } from '../interfaces/sprint.interface'
import { StatusTypeEnum } from '../enums/status-type'
import { JIRA_BASE_URL } from '../configs/constants'

interface JiraSprintData {
  sprintId: number;
  data: ReturnedDataInterface;
}

const prisma = createPrismaClient()

const getAll = middy(async (event: APIGatewayEvent, context: Context, callback: Callback) => {
  // await new Promise(resolve => setTimeout(resolve, 3000));
  const reports = await prisma.report.findMany({
    select: {
      id: true,
      description: true,
      month:true,
      year:  true,
      status: true,
      sprints: {
        select: {
          id: true,
          name: true,
          url: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  return {
    body: JSON.stringify(reports),
    statusCode: 200,
  };
})
  .use(cors())
  .use(httpErrorHandler())


const getById = middy(async (event: APIGatewayEvent, context: Context, callback: Callback) => {
  const id = parseInt(event.pathParameters.id)
  // await new Promise(resolve => setTimeout(resolve, 5000));
  const report = await prisma.report.findUnique({
    select: {
      id: true,
      month: true,
      year: true,
      description: true,
      status: {
        select: {
          name: true
        }
      },
      sprints: {
        select: {
          id: true,
          name: true,
          url: true,
          startDate: true,
          endDate: true,
          bankHolidays:  true,
          users: {
            select: {
              vacationDays: true,
              feedbackWeeks: true,
              completed: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  roles: {
                    select: {
                      role: {
                        select: {
                          id: true,
                          name: true,
                        }
                      }
                    }
                  }
                }
              },
            },
            orderBy: {
              userId: 'asc'
            }
          },
          issues: {
            select: {
              id: true,
              name: true,
              summary: true,
              points: true,
              userId: true,
              issueType: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          id: 'asc'
        }
      }
    },
    where: {
      id: id
    }
  })
  if(!report) {
    return {
      body: JSON.stringify({}),
      statusCode: 200,
    }; 
  }
  // TODO: find a smarter way to remove the user from the api
  const developerRoleId = await prisma.role.findFirst({where: {name: RoleTypeEnum.DEVELOPER}})
  const refactorSprints = {
    ...report, 
    sprints: report.sprints.map(sprint => {
      return {
        ...sprint, 
        // users: sprint.users.map(user => {
        //   if (user.user.roles.some(r => r.roleId == developerRoleId.id)) {
        //     return {
        //       ...user.user,
        //       vacationDays: user.vacationDays,
        //       feedbackWeeks: user.feedbackWeeks,
        //       completed: user.completed,
        //       roles: user.user.roles.map(r => r.roleId)
        //     }
        //   }
        // })
        users: sprint.users.reduce((filtered, user) => {
          if (user.user.roles.some(r => r.role.id == developerRoleId.id)) {
            filtered.push({
              ...user.user,
              vacationDays: user.vacationDays,
              feedbackWeeks: user.feedbackWeeks,
              completed: user.completed,
              roles: user.user.roles.map(r => r.role.name)
            })
          }
          return filtered
        }, []),
        issues: sprint.issues.map(issue => {
          return {
            ...issue,
            url: `${JIRA_BASE_URL}/browse/${issue.name}`
          }
        })
      }
    })
  }
  return {
    body: JSON.stringify(refactorSprints),
    statusCode: 200,
  };  
})
  .use(cors())
  .use(httpErrorHandler())


const add = middy(async(event: APIGatewayEvent, context: Context, callback: Callback) => {
  // TODO: check if i can use a transaction here
  const reportDataBody: CreateReportDto= JSON.parse(event.body)
  const month = parseInt(reportDataBody.month)
  const year = parseInt(reportDataBody.year)
  const findReport: Report = await prisma.report.findFirst({where: {month: month, year: year}})
  if (findReport) {
    return {
      body: JSON.stringify(`Report for the month ${reportDataBody.month} already exist`),
      statusCode: 400
    }
  }
  const reportCreateData = {
    month: month,
    year: year,
    description: reportDataBody.description,
  }
  // check if sprint already exists
  let existingSprints: string[] = []
  for await (let sprint of reportDataBody.sprints) {
    const findExistingSprint = await prisma.sprint.findUnique({where: {url: sprint.url}})
    if (findExistingSprint) {
      existingSprints.push(sprint.url)
    }
  }
  if(existingSprints.length > 0) {
    return {
      body: JSON.stringify(`Sprint already exists: ${existingSprints.toString()}`),
      statusCode: 400,
    }
  }
  const newSprints: NewSprintPayloadInterface[] = reportDataBody.sprints.map(sprint => {
    return {
      url: sprint.url
    }
  })
  // @ts-ignore
  const createdReport: Report = await prisma.report.create({data: reportCreateData})
  await addSprint(createdReport, newSprints)
  return {
    body: JSON.stringify('test'),
    statusCode: 200,
  }
})
  .use(cors())
  .use(httpErrorHandler())


const update = middy(async(event: APIGatewayEvent, context: Context, callback: Callback) => {
  const reportDataBody: CreateReportDto= JSON.parse(event.body)
  const reportId = parseInt(event.pathParameters.id)
  const findReportById = await prisma.report.findUnique({
    include: {sprints: true},
    where: {id: reportId}
  })
  if (!findReportById) {
    return {
      body: JSON.stringify(`Report with id ${reportId} not exist`),
      statusCode: 400
    }
  }
  const findExistingReportByMonth = await prisma.report.findFirst({
    include: {
      sprints: true
    },
    where: {
      month: parseInt(reportDataBody.month),
      year:  parseInt(reportDataBody.year),
      NOT: {
        id: reportId
      }
    }
  })
  if (findExistingReportByMonth) {
    return {
      body: JSON.stringify(`Report with month ${reportDataBody.month} and year ${reportDataBody.year} already exist`),
      statusCode: 400
    }
  }
  // check new/to be deleted sprints
  const sprintsToDelete = []
  const sprintsToAdd = []
  findReportById.sprints.forEach(sprint => {
    // if report from DB is not in request body then should be deleted
    if (!reportDataBody.sprints.some(e => e.url === sprint.url)) {
      sprintsToDelete.push(sprint)
    }
  })
  reportDataBody.sprints.forEach(sprint => {
    if (!findReportById.sprints.some(e => e.url === sprint.url)) {
      sprintsToAdd.push({url: sprint.url, reportId: reportId})
    }
  })
  const existingSprints = []
  for await (let sprint of sprintsToAdd) {
    const findExistingSprint = await prisma.sprint.findUnique({where: {url: sprint.url}})
    if (findExistingSprint) {
      existingSprints.push(sprint.url)
    }
  }
  if(existingSprints.length > 0) {
    return {
      body: JSON.stringify(`Sprint already exists: ${existingSprints.toString()}`),
      statusCode: 400,
    }
  }
  // create new sprints not existing in DB but are present in the request
  const r = await prisma.$transaction(async () => {
    await prisma.report.update({
      where: {id: reportId},
      data: {
        month: parseInt(reportDataBody.month),
        year: parseInt(reportDataBody.year),
        description: reportDataBody.description,
      }
    })
    // sprints to add 
    await addSprint(findReportById, sprintsToAdd)
    // delete sprints not present in the request
    for await (const sprint of sprintsToDelete) {
        // first we need to delete the foreign tables data
        await prisma.issue.deleteMany({where: {sprint: sprint}})
        await prisma.userSprint.deleteMany({where: {sprint: sprint}})
        await prisma.sprint.delete({where: {url: sprint.url}})
    }
  })

  return {
    body: JSON.stringify('Updated'),
    statusCode: 200,
  }
})
  .use(cors())
  .use(httpErrorHandler())


const populate = middy(async(event: APIGatewayEvent, context: Context, callback: Callback) => {
  // TODO: this route is  doing alot of stuff, a lambda timeout is possible, will see
  const requestBody: {jiraSesionId: string} = JSON.parse(event.body)
  const jiraSesionIdCookie: string = requestBody.jiraSesionId
  const reportId = parseInt(event.pathParameters.id)
  const findSprintsPerReport = await prisma.sprint.findMany({where: {reportId: reportId}})
  const findSprintIds = findSprintsPerReport.map(sprint => sprint.id)
  const findStoryTypes = await prisma.issueType.findMany()
  const populatedStatus = await prisma.status.findUnique({where: {name: StatusTypeEnum.POPULATED}})
  const findUserPerSprints = await prisma.userSprint.findMany({
    select: {
      user: {
        select: {
          id: true,
          email: true,
        }
      },
      sprintId: true,
    },
    where: {
      sprintId: {
        in: findSprintIds
      }
    }
  })
  const updateReportStatus = await prisma.report.update({
    where: {id: reportId}, 
    data: {
      statusId: populatedStatus.id
    }
  })
  const jiraSprintsData: JiraSprintData[] = []
  // refactor response for DB
  for await (let sprint of findSprintsPerReport) {
    const sprintDetailsJira = await fetchJiraDetails(sprint.url, jiraSesionIdCookie)
    if (sprintDetailsJira.status != 200) {
      return {
        body: JSON.stringify(sprintDetailsJira.error),
        statusCode: sprintDetailsJira.status,
      }
    }
    jiraSprintsData.push({
      sprintId: sprint.id,
      data: sprintDetailsJira.data
    })
  }
  //update sprints and add/update issues
  for await (let sprintData of jiraSprintsData) {
    const updateSprint = await prisma.sprint.update({
      where: {id: sprintData.sprintId}, 
      data: {
        name: sprintData.data.sprintName,
        startDate: sprintData.data.sprintStartDate,
        endDate: sprintData.data.sprintEndDate
      }
    })
    // delete existing issues before populating the report with the issues
    const deleteIssues = await prisma.issue.deleteMany({
      where: {
        sprintId: sprintData.sprintId
      },
    })
    // add issues
    for await (let issue of sprintData.data.issues) {
      const issueMapped = findUserPerSprints.filter(el => el.sprintId == sprintData.sprintId && el.user.email == issue.assignee)
      if (issueMapped.length != 0) {
        const upsertedIssue = await prisma.issue.upsert({
          where: {
            name: issue.key
          },
          create: {
            name: issue.key,
            sprintId: sprintData.sprintId,
            userId: issueMapped[0].user.id,
            issueTypeId: mapJiraTypeToIssueType(issue.typeId, findStoryTypes),
            points: issue.currentEstimateStatistic,
            summary: issue.summary,
          },
          update: {
            sprintId: sprintData.sprintId,
            userId: issueMapped[0].user.id,
            issueTypeId: mapJiraTypeToIssueType(issue.typeId, findStoryTypes),
            points: issue.currentEstimateStatistic,
            summary: issue.summary,
          }
        })
      }
    }
  }

  return {
    body: JSON.stringify(jiraSprintsData),
    statusCode: 200,
  }
})
  .use(cors())
  .use(httpErrorHandler())

  const info = middy(async(event: APIGatewayEvent, context: Context, callback: Callback) => {
    const reportId = parseInt(event.pathParameters.id)
    // if (!reportId) {
    //   return {
    //     body: JSON.stringify({}),
    //     statusCode: 200,
    //   }; 
    // }
    const report = await prisma.report.findUnique({
      select: {
        id: true,
        month: true,
        year: true,
        status: {
          select: {
            name: true
          }
        },
        sprints: {
          select: {
            id: true,
            name: true,
            bankHolidays: true,
            sprintDays: true,
            startDate: true,
            endDate: true,
            users: {
              select: {
                user: {
                  select: {
                    id: true,
                    email:true
                  }
                },
                feedbackWeeks: true,
                vacationDays: true
              }
            },
            issues: {
              select: {
                id:true,
                name:true,
                points: true,
                summary: true,
                issueType:{
                  select: {
                    name: true
                  }
                },
                user: {
                  select: {
                    id: true,
                    email: true,
                  }
                }
              }
           },
          },
        }
      },
      where: {id: reportId}
    })
    return {
      body: JSON.stringify(report),
      statusCode: 200,
    }
  })
  .use(cors())
  .use(httpErrorHandler())


export { 
  getAll,
  getById,
  add,
  update,
  populate,
  info
}

