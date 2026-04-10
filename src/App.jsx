import { useState } from 'react';
import HomeView from './views/HomeView';
import KitchenView from './views/KitchenView';
import WaiterView from './views/WaiterView';
import JugoView from './views/JugoView';
import WaiterNameScreen from './components/WaiterNameScreen';
import { useNativePush } from './hooks/useNativePush';

const STORAGE_KEY      = 'misterjugo_mode';
const WAITER_NAME_KEY  = 'misterjugo_waiter_name';

export default function App() {
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [waiterName, setWaiterName] = useState(() => localStorage.getItem(WAITER_NAME_KEY));

  // Registrar Token de Notificaciones Push Nativas si hay un modo seleccionado
  useNativePush(mode);


  const selectMode = (selectedMode) => {
    localStorage.setItem(STORAGE_KEY, selectedMode);
    setMode(selectedMode);
  };

  const changeMode = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMode(null);
  };

  const handleWaiterName = (name) => {
    localStorage.setItem(WAITER_NAME_KEY, name);
    setWaiterName(name);
  };

  const changeWaiterName = () => {
    localStorage.removeItem(WAITER_NAME_KEY);
    setWaiterName(null);
  };

  if (!mode) return <HomeView onSelect={selectMode} />;
  if (mode === 'kitchen') return <KitchenView onChangeMode={changeMode} />;
  if (mode === 'jugo')    return <JugoView onChangeMode={changeMode} />;

  if (mode === 'waiter') {
    // Si no hay nombre → pedir nombre primero
    if (!waiterName) return <WaiterNameScreen onConfirm={handleWaiterName} />;
    return <WaiterView onChangeMode={changeMode} waiterName={waiterName} onChangeName={changeWaiterName} />;
  }

  return <HomeView onSelect={selectMode} />;
}
