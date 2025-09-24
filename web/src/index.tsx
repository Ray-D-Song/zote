import { render } from 'preact';
import { Header, TAB } from './components/Header.tsx';
import { Home } from './pages/home.tsx';
import { Setting } from './pages/setting.tsx';
import { MilkdownProvider } from '@milkdown/react';
import { useSignal } from '@preact/signals';
import { ThemeProvider } from './context/themeContext';

import './style.css';
import 'virtual:uno.css'

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
