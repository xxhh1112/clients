export class TreeNode<T extends ITreeNodeObject> {
  parent: T;
  node: T;
  children: TreeNode<T>[] = [];

  constructor(node: T, name: string, parent: T, id?: string) {
    this.parent = parent;
    this.node = node;
    this.node.name = name;
    if (id) {
      this.node.id = id;
    }
  }
}

export interface ITreeNodeObject {
  id: string;
  name: string;
}
