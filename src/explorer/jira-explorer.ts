import * as vscode from 'vscode';
import { getConfigurationByKey } from '../shared/configuration';
import { CONFIG, LOADING } from '../shared/constants';
import { ItemGroupingStrategy, IItemFields, IStatus, IIssueGroup, IIssue } from '../http/api.model';
import state from '../state/state';
import { DividerItem } from './item/divider-item';
import { FilterInfoItem } from './item/filter-info-item';
import { IssueItemGroup } from './item/issue-item-group';
import { IssueItem } from './item/issue-item';
import { LimitInfoItem } from './item/limit-info';
import { LoadingItem } from './item/loading-item';
import { NoResultItem } from './item/no-result-item';

export class JiraExplorer implements vscode.TreeDataProvider<IssueItemGroup> {
  private groupingStrategy: ItemGroupingStrategy|undefined;
  private rootElements: IssueItemGroup[] = [];

  private _onDidChangeTreeData: vscode.EventEmitter<IssueItemGroup | undefined> = new vscode.EventEmitter<IssueItemGroup | undefined>();
  readonly onDidChangeTreeData: vscode.Event<IssueItemGroup | undefined> = this._onDidChangeTreeData.event;

  constructor() {}

  private getRootElements(groupingStrategy: ItemGroupingStrategy): IssueItemGroup[] {
    if (groupingStrategy === this.groupingStrategy) {
      return this.rootElements;
    }

    let groupItems: IItemFields[];

    if (groupingStrategy === ItemGroupingStrategy.ASSIGNEE) {
      groupItems = state.assignees;
    } else if (groupingStrategy === ItemGroupingStrategy.PRIORITY) {
      groupItems = state.priorities;
    } else {
      groupItems = state.statuses;
    }

    if (groupItems.length === 0) {
      return this.rootElements;
    }

    this.groupingStrategy = groupingStrategy;
    
    this.rootElements = groupItems
      .reduce((groups: IssueItemGroup[], item: IItemFields) =>
        groups.concat(
          new IssueItemGroup({
            type: groupingStrategy,
            value: item.name,
            issues: []
          })
        ),
        []
      );
    
    if (groupingStrategy === ItemGroupingStrategy.ASSIGNEE) {
      this.rootElements.push(new IssueItemGroup({
        type: groupingStrategy,
        value: `No ${groupingStrategy}`,
        issues: []
      }));
    }

    return this.rootElements;
  }

  async refresh(): Promise<void> {
    this._onDidChangeTreeData.fire();
  }

  async updateWithItem(item: IIssue): Promise<void> {
    const groupValue = item.fields[state.groupingStrategy].name;
    const groupItem = this.rootElements.find((groupItem: IssueItemGroup) => {
      return groupItem.group.value === groupValue;
    });
    
    if (groupItem !== undefined) {
      groupItem.group.issues.push(item);
      groupItem.update();
      this._onDidChangeTreeData.fire(groupItem);
    }
  }

  getTreeItem(element: IssueItemGroup): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: IssueItemGroup): Promise<any[]> {
    const project = await getConfigurationByKey(CONFIG.WORKING_PROJECT);

    if (element) {
      return element.group.issues.map((issue: IIssue) =>
        new IssueItem(issue, {
          command: 'jira-plugin.openIssueCommand',
          title: 'View Issue',
          arguments: [issue]
        })
      );
    } else if (state.issues.length > 0) {
      return state.issues.reduce((groups: IssueItemGroup[], issue: IIssue) => {
        // Find the item group or default to the `No GroupingStrategy` item
        const itemGroup = groups.find(groupItem => {
          if (!issue.fields[state.groupingStrategy]) {
            return false;
          }
          return groupItem.group.value === issue.fields[groupItem.group.type].name;
        }) || groups.find(groupItem => (groupItem.group.value === `No ${state.groupingStrategy}`));

        const existingItem = (<IssueItemGroup> itemGroup).group
          .issues.find((i: IIssue) => i.id === issue.id);
        
        if (!existingItem) {
          (<IssueItemGroup> itemGroup).group.issues.push(issue);
        }
        
        return groups;
      }, this.getRootElements(state.groupingStrategy))
        .filter((groupItem: IssueItemGroup) => groupItem.group.issues.length > 0)
        .map((groupItem: IssueItemGroup) => groupItem.update());
    } else {
      // used for show loading item in the explorer
      if (state.currentFilter === LOADING.text) {
        return [new LoadingItem()];
      }
      // no result
      return [new FilterInfoItem(project || '', state.currentFilter, state.issues.length), new DividerItem(), new NoResultItem(project || '')];
    }
  }
}
