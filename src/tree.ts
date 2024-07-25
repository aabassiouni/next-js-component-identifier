export type Component = {
  name: string;
  path: string;
  componentType?: "client" | "server";
};

export class TreeNode {
  value: Component;
  children: TreeNode[];

  constructor(value: Component) {
    this.value = value;
    this.children = [];
  }

  addChild(childNode: TreeNode) {
    this.children.push(childNode);
  }
}

export class Tree {
  root: TreeNode;

  constructor(rootValue: Component) {
    this.root = new TreeNode(rootValue);
  }

  // Method to find a node by value
  findNode(value: Component, node = this.root): TreeNode | null {
    if (node.value === value) {
      return node;
    }
    for (const child of node.children) {
      const found = this.findNode(value, child);
      if (found) return found;
    }
    return null;
  }

  // Method to add a child to a specific node
  addChild(parentValue: Component, childValue: Component) {
    const parentNode = this.findNode(parentValue);
    if (parentNode) {
      parentNode.addChild(new TreeNode(childValue));
    } else {
      console.log(`Parent node with value ${parentValue} not found`);
    }
  }

  // Method to print the tree structure
  print(node = this.root, level = 0) {
    console.log("\t".repeat(level) + node.value.name);
    for (const child of node.children) {
      this.print(child, level + 1);
    }
  }
}
