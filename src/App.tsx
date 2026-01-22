import { useState, useEffect } from 'react';
import { Game } from './components/Game';
import { AdminPanel } from './components/AdminPanel';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (currentPath === '#admin') {
    return <AdminPanel />;
  }

  return <Game />;
}

export default App;
