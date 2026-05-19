import { useState, useEffect } from 'react';
import { GameProvider } from './state/GameProvider';
import { useGameState } from './hooks/useGameState';
import { StartScreen } from './components/screens/StartScreen';
import { GameScreen } from './components/screens/GameScreen';
import { GameOverScreen } from './components/screens/GameOverScreen';

function ScreenRouter() {
  const state = useGameState();
  const [screen, setScreen] = useState<'start' | 'game' | 'gameover'>('start');

  useEffect(() => {
    if (state.gameResult) {
      setScreen('gameover');
    }
  }, [state.gameResult]);

  const handleStart = () => setScreen('game');
  const handleRestart = () => setScreen('start');

  switch (screen) {
    case 'start':
      return <StartScreen onStart={handleStart} />;
    case 'game':
      if (state.gameResult) {
        return <GameOverScreen onRestart={handleRestart} />;
      }
      return <GameScreen />;
    case 'gameover':
      return <GameOverScreen onRestart={handleRestart} />;
    default:
      return <StartScreen onStart={handleStart} />;
  }
}

export default function App() {
  return (
    <GameProvider>
      <ScreenRouter />
    </GameProvider>
  );
}
