import { ITreeNodeObject, TreeNode } from "@bitwarden/common/models/domain/treeNode";

export class DynamicTreeNode<T extends ITreeNodeObject> {
  fullList: T[];
  nestedList: TreeNode<T>;

  hasId(id: string): boolean {
    return this.fullList != null && this.fullList.filter((i: T) => i.id === id).length > 0;
  }

  constructor(init?: Partial<DynamicTreeNode<T>>) {
    Object.assign(this, init);
  }
}
