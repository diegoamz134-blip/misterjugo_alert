import { useState, useEffect } from 'react';
import HomeView from './views/HomeView';
import KitchenView from './views/KitchenView';
import WaiterView from './views/WaiterView';

const STORAGE_KEY = 'misterjugo_mode';

export default function App() {
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEY));

  const selectMode = (selectedMode) => {
    localStorage.setItem(STORAGE_KEY, selectedMode);
    setMode(selectedMode);
  };

  const changeMode = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMode(null);
  };

  if (!mode) return <HomeView onSelect={selectMode} />;
  if (mode === 'kitchen') return <KitchenView onChangeMode={changeMode} />;
  if (mode === 'waiter') return <WaiterView onChangeMode={changeMode} />;

  // fallback
  return <HomeView onSelect={selectMode} />;
}
