import { Nav } from '@douyinfe/semi-ui';

export enum TAB {
  editor,
  setting
}

interface HeaderProps {
  activeTab: TAB
  setActiveTab: (t: TAB) => void
}

export function Header({
  activeTab,
  setActiveTab
}: HeaderProps) {

  return <Nav
    items={[
      { itemKey: TAB.editor, text: '编辑器' },
      { itemKey: TAB.setting, text: '设置' },
    ]}
    mode='horizontal'
    selectedKeys={[activeTab]}
    onSelect={s => setActiveTab(s.itemKey as TAB)}
  />
}
