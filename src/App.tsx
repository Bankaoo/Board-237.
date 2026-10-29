/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { ControlsOverlay } from './components/ControlsOverlay';
import { RunResultModal } from './components/RunResultModal';
import { AchievementModal } from './components/AchievementModal';
import { StatsModal } from './components/StatsModal';
import { PauseModal } from './components/PauseModal';
import { StartScreen } from './components/StartScreen';
import { HelpModal } from './components/HelpModal';
import { soundManager } from './services/audio';
import { achievementService } from './services/achievements';
import { RunOutcome, BusConfig, Achievement } from './types/game';
import { Trophy, Footprints, Zap, Eye, LogIn } from 'lucide-react';

export default function App() {
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [attemptNumber, setAttemptNumber] = useState<number>(1);

  // Result state
  const [currentOutcome, setCurrentOutcome] = useState<RunOutcome>('none');
  const [finalPosition, setFinalPosition] = useState<number>(0);
  const [observedBus, setObservedBus] = useState<BusConfig | null>(null);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);

  // Modals state
  const [showAchievements, setShowAchievements] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Sound state
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [volume, setVolume] = useState<number>(soundManager.getVolume());

  // Persistent achievements & stats
  const [achievements, setAchievements] = useState<Achievement[]>(achievementService.getAchievements());
  const [stats, setStats] = useState(achievementService.getStats());

  // Recent Achievement Toast notification
  const [toastAchievement, setToastAchievement] = useState<Achievement | null>(null);

  // Listen for achievement unlocks
  useEffect(() => {
    achievementService.setUnlockListener((unlockedAch) => {
      setAchievements(achievementService.getAchievements());
      setStats(achievementService.getStats());
      setToastAchievement(unlockedAch);

      setTimeout(() => {
        setToastAchievement((prev) => (prev?.id === unlockedAch.id ? null : prev));
      }, 4200);
    });
  }, []);

  const refreshStorageData = useCallback(() => {
    setAchievements(achievementService.getAchievements());
    setStats(achievementService.getStats());
  }, []);

  // Audio Handlers
  const handleToggleMute = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleVolumeChange = useCallback((newVol: number) => {
    soundManager.setVolume(newVol);
    setVolume(newVol);
    if (isMuted && newVol > 0) {
      setIsMuted(false);
    }
  }, [isMuted]);

  // Start new run from start screen
  const handleStartGame = useCallback(() => {
    setHasStarted(true);
    setIsPlaying(true);
    setIsPaused(false);
    setShowResultModal(false);
    refreshStorageData();
  }, [refreshStorageData]);

  // Restart next run
  const handleRestartRun = useCallback(() => {
    setAttemptNumber((prev) => prev + 1);
    setIsPlaying(true);
    setIsPaused(false);
    setShowResultModal(false);
    setCurrentOutcome('none');
    setObservedBus(null);
    refreshStorageData();
  }, [refreshStorageData]);

  // Pause toggling
  const handleTogglePause = useCallback(() => {
    if (!isPlaying || showResultModal) return;
    setIsPaused((prev) => !prev);
  }, [isPlaying, showResultModal]);

  // Run conclusion handler from GameCanvas
  const handleRunFinished = useCallback(
    (outcome: RunOutcome, endPosition: number, bus?: BusConfig) => {
      setCurrentOutcome(outcome);
      setFinalPosition(endPosition);
      setObservedBus(bus || null);
      refreshStorageData();

      // Show result modal after a brief pause so player sees the action finish
      setTimeout(() => {
        setShowResultModal(true);
      }, 700);
    },
    [refreshStorageData]
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // On-screen virtual button triggers for touch or mouse
  const simulateKeyDown = (code: string) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
  };
  const simulateKeyUp = (code: string) => {
    window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-between p-3 sm:p-5 select-none font-mono">
      {/* Achievement Toast Banner */}
      {toastAchievement && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-neutral-900 border-2 border-amber-400 px-4 py-2.5 rounded-xl shadow-2xl animate-bounce">
          <span className="text-2xl">{toastAchievement.icon}</span>
          <div>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
              🏆 Achievement Unlocked!
            </span>
            <span className="text-xs font-bold text-white">{toastAchievement.title}</span>
          </div>
        </div>
      )}

      {/* Main Container constrained to 16:9 width */}
      <div className="w-full max-w-4xl flex flex-col items-center gap-3">
        {/* Controls Overlay Header */}
        <ControlsOverlay
          isMuted={isMuted}
          volume={volume}
          onToggleMute={handleToggleMute}
          onVolumeChange={handleVolumeChange}
          onOpenAchievements={() => setShowAchievements(true)}
          onOpenStats={() => setShowStats(true)}
          onOpenHelp={() => setShowHelp(true)}
          onTogglePause={handleTogglePause}
          onRestartRun={handleRestartRun}
          unlockedAchievementsCount={unlockedCount}
          totalAchievementsCount={achievements.length}
          isPlaying={isPlaying && hasStarted && !showResultModal}
        />

        {/* Viewport Box (Fixed 16:9 aspect ratio) */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-neutral-800 bg-neutral-950">
          {/* 2D Canvas */}
          <GameCanvas
            isPlaying={isPlaying && hasStarted}
            isPaused={isPaused}
            attemptNumber={attemptNumber}
            onRunFinished={handleRunFinished}
            onTogglePause={handleTogglePause}
          />

          {/* Start Screen Overlay */}
          {!hasStarted && (
            <StartScreen
              onStart={handleStartGame}
              onOpenAchievements={() => setShowAchievements(true)}
              onOpenStats={() => setShowStats(true)}
              unlockedCount={unlockedCount}
              totalCount={achievements.length}
            />
          )}

          {/* Pause Modal */}
          <PauseModal
            isOpen={isPaused}
            onResume={() => setIsPaused(false)}
            onRestart={handleRestartRun}
            isMuted={isMuted}
            volume={volume}
            onToggleMute={handleToggleMute}
            onVolumeChange={handleVolumeChange}
          />

          {/* Run Outcome Results Modal */}
          {showResultModal && (
            <RunResultModal
              outcome={currentOutcome}
              finalPosition={finalPosition}
              busDetails={observedBus}
              onRestart={handleRestartRun}
              onOpenAchievements={() => setShowAchievements(true)}
            />
          )}
        </div>

        {/* Virtual On-Screen Controls for touch & mouse users */}
        <div className="w-full grid grid-cols-4 gap-2 text-xs font-mono">
          <button
            onMouseDown={() => simulateKeyDown('KeyW')}
            onMouseUp={() => simulateKeyUp('KeyW')}
            onTouchStart={() => simulateKeyDown('KeyW')}
            onTouchEnd={() => simulateKeyUp('KeyW')}
            className="flex flex-col items-center justify-center gap-1 bg-neutral-900 active:bg-amber-600/30 hover:bg-neutral-800 border border-neutral-700 py-2.5 rounded-lg text-neutral-200 transition-colors cursor-pointer select-none"
          >
            <Footprints className="w-4 h-4 text-amber-400" />
            <span className="font-bold">WALK (W)</span>
          </button>

          <button
            onMouseDown={() => simulateKeyDown('ShiftLeft')}
            onMouseUp={() => simulateKeyUp('ShiftLeft')}
            onTouchStart={() => simulateKeyDown('ShiftLeft')}
            onTouchEnd={() => simulateKeyUp('ShiftLeft')}
            className="flex flex-col items-center justify-center gap-1 bg-neutral-900 active:bg-sky-600/30 hover:bg-neutral-800 border border-neutral-700 py-2.5 rounded-lg text-neutral-200 transition-colors cursor-pointer select-none"
          >
            <Zap className="w-4 h-4 text-sky-400" />
            <span className="font-bold">SPRINT (Shift)</span>
          </button>

          <button
            onClick={() => simulateKeyDown('Space')}
            className="flex flex-col items-center justify-center gap-1 bg-neutral-900 active:bg-red-600/30 hover:bg-neutral-800 border border-neutral-700 py-2.5 rounded-lg text-neutral-200 transition-colors cursor-pointer select-none"
          >
            <Eye className="w-4 h-4 text-red-400" />
            <span className="font-bold">LOOK (Space)</span>
          </button>

          <button
            onClick={() => simulateKeyDown('KeyE')}
            className="flex flex-col items-center justify-center gap-1 bg-neutral-900 active:bg-emerald-600/30 hover:bg-neutral-800 border border-neutral-700 py-2.5 rounded-lg text-neutral-200 transition-colors cursor-pointer select-none"
          >
            <LogIn className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">BOARD (E)</span>
          </button>
        </div>
      </div>

      {/* Global Modals */}
      <AchievementModal
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
        achievements={achievements}
        onResetAchievements={() => {
          achievementService.resetAchievements();
          refreshStorageData();
        }}
      />

      <StatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        stats={stats}
        achievementsUnlocked={unlockedCount}
        totalAchievements={achievements.length}
      />

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Subtle Footer */}
      <footer className="text-[11px] text-neutral-500 text-center py-2">
        <span>BOARD 237. — Shelter at 13m. 10-second window.</span>
      </footer>
    </div>
  );
}
