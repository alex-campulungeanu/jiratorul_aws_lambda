export interface IssueInterface {
  jiraId: number;
  key: string;
  typeId: string;
  summary: string;
  assignee: string;
  currentEstimateStatistic: number;
}

export interface ReturnedDataInterface {
  sprintName: string;
  sprintStartDate: string;
  sprintEndDate: string;
  issues: IssueInterface[]
}

export interface JiraResponse {
  data: any,
  error: string,
  status: number
}