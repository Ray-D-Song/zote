import { Select } from '@douyinfe/semi-ui';
import { useSignal } from '@preact/signals';

const themes = [
  { value: 'crep', label: 'Crep Light' },
  { value: 'crep-dark', label: 'Crep Dark' },
  { value: 'frame', label: 'Frame Light' },
  { value: 'frame-dark', label: 'Frame Dark' },
  { value: 'nord', label: 'Nord Light' },
  { value: 'nord-dark', label: 'Nord Dark' },
  { value: 'tomorrow', label: 'Tomorrow Light' },
  { value: 'tomorrow-dark', label: 'Tomorrow Dark' },
];

export function Setting() {
  const currentTheme = useSignal('crep');

  const handleThemeChange = (value: string) => {
    currentTheme.value = value;

    // Remove existing theme link
    const existingLink = document.querySelector('link[data-theme]');
    if (existingLink) {
      existingLink.remove();
    }

    // Add new theme link
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `/src/themes/${value}.css`;
    link.setAttribute('data-theme', value);
    document.head.appendChild(link);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>设置</h2>
      <div style={{ marginTop: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          编辑器主题
        </label>
        <Select
          value={currentTheme.value}
          onChange={handleThemeChange}
          style={{ width: '200px' }}
          optionList={themes}
        />
      </div>
    </div>
  );
}