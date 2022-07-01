import { Report, Sprint, UserSprint } from "@prisma/client";

import { RoleTypeEnum } from "../enums/role-type";
import createPrismaClient from "../lib/prismaClient";
import { NewSprintPayloadInterface } from '../interfaces/sprint.interface'

const prisma = createPrismaClient()

const addSprint = async (report: Report, sprints: NewSprintPayloadInterface[]): Promise<any> => {
  const usersForSprint = []
  const findActiveDevelopers = await prisma.user.findMany({where: {active: true, roles: {
    some: {
      role: {
        name: RoleTypeEnum.DEVELOPER
      }
    }
  }}})
  // first we need to create the sprints
  for await (const sprint of sprints){
    const newSprint = await prisma.sprint.create({data: {...sprint, reportId: report.id}})
    findActiveDevelopers.forEach(user => usersForSprint.push({userId: user.id, sprintId: newSprint.id}))
  }
  // create the user sprint relation
  const userSprintRelation = await prisma.userSprint.createMany({
    data: usersForSprint
  })

  return  userSprintRelation
}

export {
  addSprint
}