import axios, { AxiosResponse } from 'axios'
import { IssueType } from '@prisma/client'

import { JiraResponse, ReturnedDataInterface } from '../interfaces/jira.interface'
import { IssueTypeEnum } from '../enums/issue-type'
import { JIRA_BASE_URL } from '../configs/constants'

const mapJiraTypeToIssueType = (jiraType: string, issuesType: IssueType[] ) => {
  for (let type of issuesType) {
    if (jiraType === '51' && type.name == IssueTypeEnum.BUG) {
      return type.id
    } else if (jiraType === '10' && type.name == IssueTypeEnum.STORY) {
      return type.id
    }
  }
}

const prepareSprintUrl = (sprintUrl: string): string => {
  const currentUrl = new URL(sprintUrl)
  const rapidView = currentUrl.searchParams.get('rapidView')
  const sprint = currentUrl.searchParams.get('sprint')
  const preparedUrl = `${JIRA_BASE_URL}/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId=${rapidView}&sprintId=${sprint}`
  return preparedUrl
}

const fetchJiraDetails = async (sprintUrl: string, jiraSessionIdCookie: string): Promise<JiraResponse> => {
  const urlForRestCall = prepareSprintUrl(sprintUrl)
  try {
    const axiosRes: AxiosResponse = await axios.get(urlForRestCall, {
      headers: {
        'Cookie': `JSESSIONID=${jiraSessionIdCookie}`,
      },
      proxy: false //should use no proxy to bypass http_proxy and https_proxy environment variables
    })
    let returnedData: ReturnedDataInterface = {
      sprintName: '',
      sprintStartDate: '',
      sprintEndDate: '',
      issues: []
    }
    returnedData.sprintName = axiosRes.data['sprint']['name']
    returnedData.sprintStartDate = axiosRes.data['sprint']['startDate']
    returnedData.sprintEndDate = axiosRes.data['sprint']['endDate']
    const completedIssues = axiosRes.data['contents']['completedIssues']
    completedIssues.forEach(issue => {
      returnedData.issues.push({
        jiraId: issue.id,
        key: issue.key,
        assignee: issue.assignee,
        summary: issue.summary,
        typeId: issue.typeId,
        currentEstimateStatistic: issue['currentEstimateStatistic']['statFieldValue']['value']
      })
    });
    return {
      data: returnedData,
      error: null,
      status: 200
    };
  } catch (error) {
    // console.log('error', error)
    console.log(error.response?.status)
    if (error.response?.status === 401) {
      return {
        data: null,
        error: 'Wrong JIRA SESSIONID',
        status: 400
      };
    }
    return {
      data: null,
      error: 'Some internal error',
      status: 500
    };
  }
}

export {
  fetchJiraDetails,
  mapJiraTypeToIssueType
}