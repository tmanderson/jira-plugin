import * as vscode from 'vscode';

import { getConfigurationByKey } from '../shared/configuration';
import { CONFIG } from '../shared/constants';
import { Command } from './shared/command';
import { IIssue } from '../http/api.model';
import state, { canExecuteJiraAPI, isWorkingIssue } from '../state/state';
import renderIssue from '../templates/issue.template';

export class OpenIssueCommand implements Command {
  public id = 'jira-plugin.openIssueCommand';
  
  private _currentPanel: vscode.WebviewPanel | undefined = undefined;
  private _currentIssue: IIssue | undefined = undefined;

  private set issue(issue: IIssue) {
    this._currentIssue = issue;
    this.currentPanel.title = issue.key;
    this.currentPanel.webview.html = renderIssue(issue);
  }

  private get currentPanel(): vscode.WebviewPanel {
    if (this._currentPanel === undefined) {
      this._currentPanel = vscode.window.createWebviewPanel(
        'jiraTicketView',
        '',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      this.currentPanel.webview.onDidReceiveMessage(async (message: vscode.Command) => {
        const url: string = message.arguments && message.arguments[0];

        if (message.command !== this.id || !url || !canExecuteJiraAPI()) {
          return;
        }
        
        this.issue = await state.jira.getIssueByUrl(url);
      }, undefined, this.context.subscriptions);

      // Reset when the current panel is closed
      this.currentPanel.onDidDispose(() => {
        this._currentIssue = undefined;
        this._currentPanel = undefined;
      }, null, this.context.subscriptions);
    }

    return this._currentPanel;
  }

  constructor(readonly context: vscode.ExtensionContext) {}

  public run = (issueItem: IIssue): Promise<void> => {
    console.log(issueItem);
    this.issue = issueItem;
    return Promise.resolve();
  }
}
