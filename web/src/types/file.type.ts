export enum NodeType {
  Page = 1,
  Folder = 2,
}

// For frontend cotroll UI state
export interface NodeMeta {
  isOpen?: boolean
  isSelected?: boolean
  isIndeterminate?: boolean
  isCreating?: boolean
  isRenaming?: boolean
}

export interface FileNode {
  id: string
  parentId: string | null
  name: string
  type: NodeType
  sort: number
  icon?: string
  meta?: NodeMeta
}

export type FileTree = Array<FileNode & {
  children: FileNode[]
}>
