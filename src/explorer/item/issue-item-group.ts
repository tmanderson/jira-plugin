import * as vscode from 'vscode';
import { IIssueGroup, IIssue } from '../../http/api.model';
import { STATUS_ICONS } from '../../shared/constants';
import { getIconsPath } from '../../shared/utilities';

export class IssueItemGroup extends vscode.TreeItem {
  constructor(public readonly group: IIssueGroup, public readonly command?: vscode.Command) {
    super(`${group.value} - (${group.issues.length})`, vscode.TreeItemCollapsibleState.Collapsed);
  }

  public update(): vscode.TreeItem {
    this.label = `${this.group.value} - (${this.group.issues.length})`;
    return this;
  }

  get tooltip(): string {
    return this.group.value;
  }

  contextValue = 'IssueItemGroup';
}
