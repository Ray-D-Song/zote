import { MilkdownProvider } from '@milkdown/react'
import { useSignal } from '@preact/signals'
import { render } from 'preact'
import { Header, TAB } from './components/Header.tsx'
import { ThemeProvider } from './context/themeContext'
import { Home } from './pages/home.tsx'
import { Login } from './pages/login.tsx'

import { Setting } from './pages/setting.tsx'
import './style.css'
import 'virtual:uno.css'

export function App() {
  const activeTab = useSignal<TAB>(TAB.editor)
  if (true) {
    return <Login />
  }

  else {
    return (
      <ThemeProvider>
        <MilkdownProvider>
          <main class="h-screen w-screen bg-light dark:bg-dark">
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
    )
  }
}

render(<App />, document.getElementById('app'))
