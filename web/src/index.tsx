import { render } from 'preact';
import { LocationProvider, Router, Route } from 'preact-iso';

import { Header } from './components/Header.jsx';
import { Home } from './pages/Home/index.jsx';
import { NotFound } from './pages/_404.jsx';
import './style.css';
import { MilkdownProvider } from '@milkdown/react';

export function App() {
  return (
    <MilkdownProvider>
      <LocationProvider>
        <Header />
        <main>
          <Router>
            <Route path="/" component={Home} />
            <Route default component={NotFound} />
          </Router>
        </main>
      </LocationProvider>
    </MilkdownProvider>
  );
}

render(<App />, document.getElementById('app'));
