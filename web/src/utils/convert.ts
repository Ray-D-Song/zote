import type { FileNode, FileTree } from '@/types/file.type'

export function buildFileTree(list: FileNode[]): FileTree {
  if (!list || list.length === 0) {
    return []
  }

  const nodeMap = new Map<string, FileNode & { children: FileNode[] }>()

  for (const node of list) {
    nodeMap.set(node.id, { ...node, children: [] })
  }

  const rootNodes: FileTree = []

  for (const node of list) {
    const currentNode = nodeMap.get(node.id)!

    if (node.parentId === null) {
      // Root node
      rootNodes.push(currentNode)
    }
    else {
      // Child node - add to parent's children
      const parentNode = nodeMap.get(node.parentId)
      if (parentNode) {
        parentNode.children.push(currentNode)
      }
      else {
        // Parent not found, treat as root node
        rootNodes.push(currentNode)
      }
    }
  }

  const sortNodes = (nodes: FileTree) => {
    for (const node of nodes) {
      if (node.children.length > 0) {
        node.children.sort((a, b) => a.sort - b.sort)
        sortNodes(node.children as FileTree)
      }
    }
  }

  rootNodes.sort((a, b) => a.sort - b.sort)
  sortNodes(rootNodes)

  return rootNodes
}
