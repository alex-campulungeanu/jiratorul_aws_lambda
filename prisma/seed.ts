import { PrismaClient, Role, Status, User, IssueType } from '@prisma/client'

import { roleSeedData  } from './seeds/role-seed-data'
import { userSeedData  } from './seeds/user-seed-data'
import { statusSeedData  } from './seeds/status-seed-data'
import { issueTypeSeedData  } from './seeds/issue-type-seed-data'

const prisma = new PrismaClient()

const addRoles = async function() {
  for await (let roleItem of roleSeedData) {
    const role: Role= await prisma.role.upsert({
      where: {
        id: roleItem.id,
      },
      update: roleItem,
      create: roleItem,
    })
  }
}

const addUsers = async function() {
  for await (let userItem of userSeedData) {
    const user: User= await prisma.user.upsert({
      where: {
        id: userItem.id,
      },
      update: userItem,
      create: userItem,
    })
  }
}

const addStatuses = async function() {
  for await (let statusItem of statusSeedData) {
    const status: Status = await prisma.status.upsert({
      where: {
        id: statusItem.id,
      },
      update: statusItem,
      create: statusItem,
    })
  }
}

const addIssueType = async function() {
  for await (let type of issueTypeSeedData) {
    const issueType: IssueType = await prisma.issueType.upsert({
      where: {
        id: type.id,
      },
      update: type,
      create: type,
    })
  }
}

async function main() {
  await prisma.$connect()
  await addRoles()
  console.log('[+] add roles')
  // await addUsers()
  // console.log('[+] add users')
  await addStatuses()
  console.log('[+] add statuses')
  await addIssueType()
  console.log('[+] add issueType')
}

main()
  .catch((e) => {
    throw e
  })
  .finally(async () => {
    await prisma.$disconnect()
  })