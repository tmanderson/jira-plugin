import * as vscode from 'vscode';

import { getConfigurationByKey } from '../shared/configuration';
import { CONFIG } from '../shared/constants';
import { Command } from './shared/command';
import { IIssue } from '../http/api.model';
import state, { canExecuteJiraAPI, getIssueByUrl, getIssueByKey } from '../state/state';
import renderIssue from '../templates/issue.template';

export class OpenIssueCommand implements Command {
  public id = 'jira-plugin.openIssueCommand';

  private history: { key: string, url: string }[] = [];
  
  private _currentPanel: vscode.WebviewPanel | undefined = undefined;
  private _currentIssue: IIssue | undefined = undefined;

  private set issue(issue: IIssue) {
    if (this._currentIssue && issue.id === this._currentIssue.id) {
      return;
    }

    const historyIndex = this.history.findIndex(item => item.url === issue.self);
    // Remove item from history stack if it was previous item
    if (historyIndex >= 0 && historyIndex === this.history.length - 1) {
      this.history.pop();
    // If item wasn't in history and we have a previously active item, add it to the stack
    } else if (this._currentIssue !== undefined) {
      this.history.push({
        key: this._currentIssue.key,
        url: this._currentIssue.self
      });
    }

    this._currentIssue = issue;
    this.currentPanel.title = issue.key;
    this.currentPanel.webview.html = renderIssue(issue, this.history);
  }

  private get currentPanel(): vscode.WebviewPanel {
    if (this._currentPanel === undefined) {
      this._currentPanel = vscode.window.createWebviewPanel(
        'jiraTicketView',
        '',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      this.currentPanel.webview.onDidReceiveMessage(
        this.handleWebviewEvent,
        undefined,
        this.context.subscriptions
      );

      // Reset when the current panel is closed
      this.currentPanel.onDidDispose(() => {
        this._currentIssue = undefined;
        this._currentPanel = undefined;
        this.history = [];
      }, null, this.context.subscriptions);
    }

    return this._currentPanel;
  }

  constructor(readonly context: vscode.ExtensionContext) {}

  private handleWebviewEvent = async (message: vscode.Command) => {
    const url: string = message.arguments && message.arguments[0];
    
    if (!url || message.command !== this.id || !canExecuteJiraAPI()) {
      return;
    }

    // vscode.commands.executeCommand();
    this.issue = await getIssueByUrl(url);
  }

  public run = (issueItem: IIssue): Promise<void> => {
    console.log(issueItem);
    this.issue = issueItem;
    return Promise.resolve();
  }
}
