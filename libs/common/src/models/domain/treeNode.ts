export class TreeNode<T extends ITreeNodeObject> {
  parent: T;
  node: T;
  children: TreeNode<T>[] = [];

  constructor(node: T, parent: T, name?: string, id?: string) {
    this.parent = parent;
    this.node = node;
    if (name) {
      this.node.name = name;
    }
    if (id) {
      this.node.id = id;
    }
  }
}

export interface ITreeNodeObject {
  id: string;
  name: string;
}
