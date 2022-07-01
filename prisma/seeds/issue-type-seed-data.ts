import { IssueType } from '@prisma/client'

import { IssueTypeEnum } from '../../src/enums/issue-type'

export const issueTypeSeedData: IssueType[] = [
  {
    id: 1,
    name: IssueTypeEnum.STORY
  },
  {
    id: 2,
    name: IssueTypeEnum.BUG,
  },
]