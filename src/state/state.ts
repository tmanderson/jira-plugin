import * as vscode from 'vscode';
import { JiraExplorer } from '../explorer/jira-explorer';
import { Jira } from '../http/api';
import { getConfigurationByKey } from '../shared/configuration';
import { ItemGroupingStrategy, IAssignee, IIssue, IJira, IPriority, IProject, IStatus, IWorkingIssue } from '../http/api.model';
import NoWorkingIssuePick from '../picks/no-working-issue-pick';
import { configIsCorrect, setConfigurationByKey, setGlobalWorkingIssue } from '../shared/configuration';
import { CONFIG, LOADING, NO_WORKING_ISSUE } from '../shared/constants';
import { StatusBarManager } from '../shared/status-bar';

export interface State {
  jira: IJira;
  context: vscode.ExtensionContext;
  channel: vscode.OutputChannel;
  statusBar: StatusBarManager;
  jiraExplorer: JiraExplorer;
  groupingStrategy: ItemGroupingStrategy;
  assignees: IAssignee[];
  statuses: IStatus[];
  priorities: IPriority[];
  projects: IProject[];
  issues: IIssue[];
  currentFilter: string;
  currentJQL: string;
  workingIssue: IWorkingIssue;
}

// initial state
const state: State = {
  jira: undefined as any,
  context: undefined as any,
  channel: undefined as any,
  statusBar: undefined as any,
  jiraExplorer: undefined as any,
  groupingStrategy: ItemGroupingStrategy.STATUS,
  assignees: [],
  statuses: [],
  priorities: [],
  projects: [],
  issues: [],
  currentFilter: LOADING.text,
  currentJQL: '',
  workingIssue: {
    issue: new NoWorkingIssuePick().pickValue,
    trackingTime: 0,
    awayTime: 0
  }
};

export default state;

export const connectToJira = async (): Promise<void> => {
  try {
    state.jira = new Jira();
    
    // save assignees, statuses and projects in the global state
    state.assignees = await state.jira.getAssignees({
      project: <string> getConfigurationByKey(CONFIG.WORKING_PROJECT)
    });
    
    state.priorities = await state.jira.getPriorities();
    state.statuses = await state.jira.getStatuses();
    state.projects = await state.jira.getProjects();
    
    state.statusBar.updateWorkingProjectItem('');
    // refresh Jira explorer list
    await vscode.commands.executeCommand('jira-plugin.allIssuesCommand');
  } catch (e) {
    setConfigurationByKey(CONFIG.WORKING_PROJECT, '');
    setTimeout(() => {
      state.statusBar.updateWorkingProjectItem('');
    }, 1000);
    changeStateIssues('', '', []);
    vscode.window.showErrorMessage(e.message);
  }
};

export const getIssueByKey = (key: string): Promise<IIssue> => {
  // Check to see if we've already loaded the issue...
  const existingIssue = state.issues.find((issue: IIssue) => issue.key === key);
    
  if (existingIssue) {
    return Promise.resolve(existingIssue);
  }

  return state.jira.getIssueByKey(key).then((issue: IIssue) => {
    state.issues.push(issue);
    state.jiraExplorer.updateWithItem(issue);
    return issue;
  });
};

export const getIssueById = (id: string): Promise<IIssue> => {
  // Check to see if we've already loaded the issue...
  const existingIssue = state.issues.find((issue: IIssue) => issue.id === id);
    
  if (existingIssue) {
    return Promise.resolve(existingIssue);
  }

  return state.jira.getIssueById(id).then((issue: IIssue) => {
    state.issues.push(issue);
    state.jiraExplorer.updateWithItem(issue);
    return issue;
  });
};

export const getIssueByUrl = (url: string): Promise<IIssue> => {
  const keyOrId: string = url.split('/').pop() || '';
  
  if (!keyOrId) {
    return Promise.reject(new Error('Invalid Jira Ticket URL'));
  }
  
  // Issue by ID
  if (keyOrId.indexOf('-') < 0) {
    return getIssueById(keyOrId);
  } else {
    return getIssueByKey(keyOrId);
  }
};

export const canExecuteJiraAPI = (): boolean => {
  return state.jira && configIsCorrect();
};

export const verifyCurrentProject = (project: string | undefined): boolean => {
  return !!project && state.projects.filter((prj: IProject) => prj.key === project).length > 0;
};

export const changeStateIssues = (filter: string, jql: string, issues: IIssue[]): void => {
  state.currentFilter = filter;
  state.currentJQL = jql;
  state.issues = issues;
  state.jiraExplorer.refresh();
};

export const changeStateWorkingIssue = async (issue: IIssue, trackingTime: number): Promise<void> => {
  const awayTime: number = 0; // FIXME: We don't need awayTime when changing issues, not sure best way to handle this.
  state.workingIssue = { issue, trackingTime, awayTime };
  state.statusBar.updateWorkingIssueItem(false);
};

export const incrementStateWorkingIssueTimePerSecond = (): void => {
  state.workingIssue.trackingTime += 1;
  // prevent writing to much on storage
  if (state.workingIssue.trackingTime % 60 === 0) {
    if (state.workingIssue.issue.key !== NO_WORKING_ISSUE.key) {
      setGlobalWorkingIssue(state.context, state.workingIssue);
    }
  }
};

// verify if it's the current working issue
export const isWorkingIssue = (issueKey: string): boolean => {
  if (issueKey === state.workingIssue.issue.key) {
    vscode.window.showErrorMessage(`Issue ${issueKey} has pending worklog. Resolve the conflict and retry the action.`);
  }
  return issueKey === state.workingIssue.issue.key;
};
