import { render } from 'preact';
import { Header, TAB } from './components/Header.jsx';
import { Home } from './pages/Home/index.jsx';
import { Setting } from './pages/setting.jsx';
import { MilkdownProvider } from '@milkdown/react';
import { useSignal } from '@preact/signals';

import './style.css';
import 'virtual:uno.css'

export function App() {
  const activeTab = useSignal<TAB>(TAB.editor)
  return (
    <MilkdownProvider>
      <Header activeTab={activeTab.value} setActiveTab={(t: TAB) => activeTab.value = t} />
      <main class={activeTab.value === TAB.editor ? '' : 'invisible'}>
        <Home />
      </main>
      <main class={activeTab.value === TAB.setting ? '' : 'invisible'}>
        <Setting />
      </main>
    </MilkdownProvider>
  );
}

render(<App />, document.getElementById('app'));
