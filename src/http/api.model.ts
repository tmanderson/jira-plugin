export interface IJira {
  search(params: { jql: string; maxResults?: number }): Promise<IIssues>;
  getIssueById(id: string): Promise<IIssue>;
  getIssueByKey(key: string): Promise<IIssue>;
  getPriorities(): Promise<IPriority[]>;
  getStatuses(): Promise<IStatus[]>;
  getProjects(): Promise<IProject[]>;
  getAssignees(param: { project: string; maxResults?: number }): Promise<IAssignee[]>;
  getTransitions(issueKey: string): Promise<ITransitions>;
  setTransition(params: { issueKey: string; transition: ISetTransition }): Promise<void>;
  setAssignIssue(params: { issueKey: string; assignee: string }): Promise<void>;
  addNewComment(params: { issueKey: string; comment: IAddComment }): Promise<IAddCommentResponse>;
  addWorkLog(params: { issueKey: string; worklog: IAddWorkLog }): Promise<void>;
}

export interface IServerInfo {
  version: string;
  versionNumbers: number[];
}

export interface IItemFields {
  name: string;
}
export interface IAssignee {
  active: boolean;
  accountId: string;
  name: string;
  key: string;
  displayName: string;
  self: string;
  avatarUrls: {
    '24x24': string;
    '48x48': string;
  };
}
export interface IIssues {
  issues: IIssue[] | undefined;
  maxResults: number;
  startAt: number;
  total: number;
}
export interface IPriority {
  self: string;
  statusColor: string;
  description: string;
  iconUrl: string;
  name: string;
}

export enum ItemGroupingStrategy {
  'STATUS'='status',
  'PRIORITY'='priority',
  'ASSIGNEE'='assignee'
}

export interface IIssueGroup {
  type: ItemGroupingStrategy;
  value: string;
  issues: IIssue[];
}

export interface IIssue {
  id: string;
  key: string;
  self: string;
  renderedFields?: {
    created: string;
    description?: string;
  };
  fields: {
    assignee: {
      avatarUrls?: {
        '24x24': string;
        '48x48': string;
      };
      displayName?: string;
      name: string;
    };
    reporter: {
      avatarUrls?: {
        '24x24': string;
        '48x48': string;
      };
      displayName?: string;
      name: string;
    };
    summary: string;
    description?: string;
    labels: string[],
    issuetype: {
      name: string;
      iconUrl: string;
    };
    priority: {
      name: string;
      iconUrl: string;
    };
    status: {
      name: string;
    };
  };
}

export interface IProject {
  key: string;
  expand: string;
  self: string;
  id: string;
  name: string;
}

export interface IStatus {
  self: string;
  description: string;
  iconUrl: string;
  name: string;
  id: string;
}

export interface ITransitions {
  transitions: ITransition[];
}

export interface ITransition {
  id: string;
  name: string;
  to: {
    name: string;
  };
}

export interface ISetTransition {
  transition: {
    id: string;
  };
}

export interface IAddComment {
  body: string;
}

export interface IAddCommentResponse {
  id: string;
}

export interface IWorkingIssue {
  issue: IIssue;
  trackingTime: number;
  awayTime: number;
}

export interface IAddWorkLog {
  timeSpentSeconds: number;
  comment?: string;
}
