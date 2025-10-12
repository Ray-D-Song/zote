import type { TreeProps } from '@douyinfe/semi-ui/lib/es/tree'
import type { FileNode, FileTree } from '@/types/file.type'
import { Tree } from '@douyinfe/semi-ui'
import { NodeType } from '@/types/file.type'
import { buildFileTree } from '@/utils/convert'

const mockFlatNodes: FileNode[] = [
  { id: '1', parentId: null, name: '项目文档', type: NodeType.Folder, sort: 1, icon: '📁' },
  { id: '2', parentId: null, name: '技术方案', type: NodeType.Folder, sort: 2, icon: '📁' },
  { id: '3', parentId: '1', name: '需求文档', type: NodeType.Page, sort: 1, icon: '📄' },
  { id: '4', parentId: '1', name: '设计文档', type: NodeType.Page, sort: 2, icon: '📄' },
  { id: '5', parentId: '1', name: '会议记录', type: NodeType.Folder, sort: 3, icon: '📁' },
  { id: '6', parentId: '5', name: '2024-01-15 周会', type: NodeType.Page, sort: 1, icon: '📄' },
  { id: '7', parentId: '5', name: '2024-01-22 周会', type: NodeType.Page, sort: 2, icon: '📄' },
  { id: '8', parentId: '2', name: '架构设计', type: NodeType.Page, sort: 1, icon: '📄' },
  { id: '9', parentId: '2', name: 'API 接口文档', type: NodeType.Page, sort: 2, icon: '📄' },
  { id: '10', parentId: '2', name: '数据库设计', type: NodeType.Folder, sort: 3, icon: '📁' },
  { id: '11', parentId: '10', name: 'ER 图', type: NodeType.Page, sort: 1, icon: '📄' },
  { id: '12', parentId: '10', name: '表结构说明', type: NodeType.Page, sort: 2, icon: '📄' },
]

// Convert to semi UI tree node
function convertToTreeData(tree: FileTree) {
  return tree.map(node => ({
    label: node.name,
    value: node.id,
    key: node.id,
    icon: node.type === NodeType.Folder ? '📁' : '📄',
    children: node.children.length > 0 ? convertToTreeData(node.children as any) : undefined,
  }))
}

const fileTree = buildFileTree(mockFlatNodes)
const treeData = convertToTreeData(fileTree)

export default function FileList(props: TreeProps) {
  return (
    <Tree
      treeData={treeData}
      filterTreeNode
      directory
      defaultExpandAll
      {...props}
    />
  )
}
