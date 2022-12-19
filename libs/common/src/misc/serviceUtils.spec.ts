import { TreeNode } from "../models/domain/tree-node";

import { ServiceUtils } from "./serviceUtils";

describe("serviceUtils", () => {
  type fakeObject = { id: string; name: string };
  let nodeTree: TreeNode<fakeObject>[];
  beforeEach(() => {
    nodeTree = [
      {
        parent: null,
        node: { id: "1", name: "1" },
        children: [
          {
            parent: { id: "1", name: "1" },
            node: { id: "1.1", name: "1.1" },
            children: [
              {
                parent: { id: "1.1", name: "1.1" },
                node: { id: "1.1.1", name: "1.1.1" },
                children: [],
              },
            ],
          },
          {
            parent: { id: "1", name: "1" },
            node: { id: "1.2", name: "1.2" },
            children: [],
          },
        ],
      },
      {
        parent: null,
        node: { id: "2", name: "2" },
        children: [
          {
            parent: { id: "2", name: "2" },
            node: { id: "2.1", name: "2.1" },
            children: [],
          },
        ],
      },
      {
        parent: null,
        node: { id: "3", name: "3" },
        children: [],
      },
    ];
  });

  describe("nestedTraverse", () => {
    it("should traverse a tree and add a node at the correct position given a valid path", () => {
      const nodeToBeAdded: fakeObject = { id: "1.2.1", name: "1.2.1" };
      const path = ["1", "1.2", "1.2.1"];

      ServiceUtils.nestedTraverse(nodeTree, 0, path, nodeToBeAdded, null, "/");
      expect(nodeTree[0].children[1].children[0].node).toEqual(nodeToBeAdded);
    });

    it("should combine the path for missing nodes and use as the added node name given an invalid path", () => {
      const nodeToBeAdded: fakeObject = { id: "blank", name: "blank" };
      const path = ["3", "3.1", "3.1.1"];

      ServiceUtils.nestedTraverse(nodeTree, 0, path, nodeToBeAdded, null, "/");
      expect(nodeTree[2].children[0].node.name).toEqual("3.1/3.1.1");
    });
  });

  describe("getTreeNodeObject", () => {
    it("should return a matching node given a single tree branch and a valid id", () => {
      const id = "1.1.1";
      const given = ServiceUtils.getTreeNodeObject(nodeTree[0], id);
      expect(given.node.id).toEqual(id);
    });
  });

  describe("getTreeNodeObjectFromList", () => {
    it("should return a matching node given a list of branches and a valid id", () => {
      const id = "1.1.1";
      const given = ServiceUtils.getTreeNodeObjectFromList(nodeTree, id);
      expect(given.node.id).toEqual(id);
    });
  });
});
