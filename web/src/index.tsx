import { render } from 'preact';
import { Header, TAB } from './components/Header.jsx';
import { Home } from './pages/home.jsx';
import { Setting } from './pages/setting.jsx';
import { MilkdownProvider } from '@milkdown/react';
import { useSignal } from '@preact/signals';
import { ThemeProvider } from './context/themeContext';

import './style.css';
import 'virtual:uno.css'
import { ReactNode } from 'preact/compat';

export function App() {
  const activeTab = useSignal<TAB>(TAB.editor)

  return (
    <ThemeProvider>
      <MilkdownProvider>
        <main class="w-screen h-screen bg-light dark:bg-dark">
          <Header activeTab={activeTab.value} setActiveTab={(t: TAB) => activeTab.value = t} />
          <div class={activeTab.value === TAB.editor ? '' : 'hidden'}>
            <Home />
          </div>
          <div class={activeTab.value === TAB.setting ? '' : 'hidden'}>
            <Setting />
          </div>
        </main>
      </MilkdownProvider>
    </ThemeProvider>
  );
}

render(<App />, document.getElementById('app'));
