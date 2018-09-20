import * as vscode from 'vscode';
import { IssueItem } from '../explorer/item/issue-item';
import { selectGroupingStrategy } from '../shared/select-utilities';
import state, { canExecuteJiraAPI, isWorkingIssue } from '../state/state';
import { Command } from './shared/command';
import { ItemGroupingStrategy } from '../http/api.model';

export class SetGroupingStrategyCommand implements Command {
  public id = 'jira-plugin.setGroupingStrategy';

  public async run(issueItem: IssueItem): Promise<void> {
    const groupingStrategy = await selectGroupingStrategy();
    
    if (groupingStrategy === undefined) {
      return;
    }

    state.groupingStrategy = groupingStrategy;
    state.jiraExplorer.refresh();
  }
}
