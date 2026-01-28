'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RefreshCw, Coffee, Brain } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type Mode = 'work' | 'shortBreak' | 'longBreak';

const TIMES = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>('work');
  const [timeLeft, setTimeLeft] = useState(TIMES.work);
  const [isActive, setIsActive] = useState(false);
  const [cycles, setCycles] = useState(0);

  const switchMode = useCallback((newMode: Mode) => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(TIMES[newMode]);
  }, []);
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      if (mode === 'work') {
        const newCycles = cycles + 1;
        setCycles(newCycles);
        if (newCycles % 4 === 0) {
          switchMode('longBreak');
        } else {
          switchMode('shortBreak');
        }
      } else {
        switchMode('work');
      }
      // Simple notification
      if (Notification.permission === "granted") {
        new Notification(mode === 'work' ? "Time for a break! ☕" : "Time to focus! 🧠");
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode, cycles, switchMode]);
  
  useEffect(() => {
    // Request notification permission on mount
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "denied") {
          Notification.requestPermission();
      }
    }
  }, []);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    switchMode('work');
    setCycles(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progress = ((TIMES[mode] - timeLeft) / TIMES[mode]) * 100;
  const modeText = {
      work: 'Focus Session',
      shortBreak: 'Short Break',
      longBreak: 'Long Break'
  }

  return (
    <Card className="w-full max-w-sm mx-auto shadow-2xl bg-white/5 border-white/10 text-white">
      <CardHeader className="items-center">
        <CardTitle className="text-2xl font-serif">{modeText[mode]}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="relative w-48 h-48 flex items-center justify-center">
            <Progress value={progress} className="absolute w-full h-full rounded-full bg-white/10" />
            <div className="absolute flex flex-col items-center justify-center w-40 h-40 rounded-full bg-gray-900">
                <span className="text-5xl font-mono font-bold tracking-tighter">
                {formatTime(timeLeft)}
                </span>
            </div>
        </div>
        <div className="flex w-full justify-center gap-4">
          <Button onClick={toggleTimer} size="lg" className="w-24 bg-primary text-primary-foreground hover:bg-primary/90">
            {isActive ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
            {isActive ? 'Pause' : 'Start'}
          </Button>
          <Button onClick={resetTimer} size="lg" variant="outline" className="w-24 bg-transparent border-white/20 hover:bg-white/10">
            <RefreshCw className="mr-2 h-5 w-5" />
            Reset
          </Button>
        </div>
        <div className="flex gap-2">
            <Button size="sm" variant={mode === 'work' ? 'secondary' : 'ghost'} className={mode === 'work' ? 'bg-white/20' : 'hover:bg-white/10'} onClick={() => switchMode('work')}><Brain className="mr-2 h-4 w-4" />Focus</Button>
            <Button size="sm" variant={mode === 'shortBreak' ? 'secondary' : 'ghost'} className={mode === 'shortBreak' ? 'bg-white/20' : 'hover:bg-white/10'} onClick={() => switchMode('shortBreak')}><Coffee className="mr-2 h-4 w-4" />Short Break</Button>
            <Button size="sm" variant={mode === 'longBreak' ? 'secondary' : 'ghost'} className={mode === 'longBreak' ? 'bg-white/20' : 'hover:bg-white/10'} onClick={() => switchMode('longBreak')}><Coffee className="mr-2 h-4 w-4" />Long Break</Button>
        </div>
      </CardContent>
    </Card>
  );
}
