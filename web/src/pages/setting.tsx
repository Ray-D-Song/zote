import { Select } from '@douyinfe/semi-ui';
import { useTheme, useEditorTheme } from '../context/themeContext.tsx';

export function Setting() {
  const { currentTheme, changeTheme, themes } = useTheme()
  const { currentEditorTheme, changeEditorTheme, editorThemes } = useEditorTheme();

  return (
    <div className="p-5">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">设置</h2>
      <div className="mt-5">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          主题
        </label>
        <Select
          value={currentTheme.value}
          onChange={changeTheme}
          style={{ width: '200px' }}
          optionList={themes}
        />
      </div>
      <div className="mt-5">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          编辑器主题
        </label>
        <Select
          value={currentEditorTheme}
          onChange={changeEditorTheme}
          style={{ width: '200px' }}
          optionList={editorThemes}
        />
      </div>
    </div>
  );
}
