/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { RunOutcome, BusConfig } from '../types/game';
import { RotateCcw, Trophy, X } from 'lucide-react';

interface RunResultModalProps {
  outcome: RunOutcome;
  finalPosition: number;
  busDetails?: BusConfig | null;
  onRestart: () => void;
  onOpenAchievements: () => void;
}

interface OutcomeContent {
  title: string;
  badge: string;
  badgeColor: string;
  headline: string;
  narrative: string;
  icon: string;
  isSuccess: boolean;
}

const OUTCOME_DETAILS: Record<RunOutcome, OutcomeContent> = {
  none: {
    title: 'Run Complete',
    badge: 'Neutral',
    badgeColor: 'bg-neutral-800 text-neutral-300',
    headline: 'The run concluded.',
    narrative: 'A quiet mist settles over the city street.',
    icon: '🌧️',
    isSuccess: false,
  },
  success_normal: {
    title: 'Made It!',
    badge: 'SUCCESS',
    badgeColor: 'bg-emerald-950 text-emerald-400 border border-emerald-700',
    headline: 'You caught Bus 237!',
    narrative:
      'Your shoes hit the rubber step well of Bus 237 just as the folding doors close. You grab a seat as the bus pulls back into the avenue.',
    icon: '🚌',
    isSuccess: true,
  },
  success_patient: {
    title: 'Patience Pays Off!',
    badge: 'SUCCESS',
    badgeColor: 'bg-amber-950 text-amber-400 border border-amber-700',
    headline: 'Caught the bus without taking a single step!',
    narrative:
      'You stayed right at the starting bench. Bus 237 pulled right up in front of you and opened its doors.',
    icon: '🧘',
    isSuccess: true,
  },
  fake_bus: {
    title: 'Fake Ride!',
    badge: 'WRONG BUS',
    badgeColor: 'bg-yellow-950 text-yellow-400 border border-yellow-700',
    headline: 'You boarded the decoy bus!',
    narrative:
      'You hurried aboard without checking the sign. The marquee above reads a different route! The bus heads in the opposite direction.',
    icon: '🎭',
    isSuccess: false,
  },
  so_close: {
    title: 'So Close!',
    badge: 'MISSED BY ONE STEP',
    badgeColor: 'bg-orange-950 text-orange-400 border border-orange-700',
    headline: 'You were right at the doors!',
    narrative:
      'Just inches away! The rubber door seal closed right before you could board and the bus accelerated away.',
    icon: '🤏',
    isSuccess: false,
  },
  pedestrian_collision: {
    title: 'Wrong Time to Look!',
    badge: 'COLLISION',
    badgeColor: 'bg-red-950 text-red-400 border border-red-700',
    headline: 'Collided with Mrs. Higgins!',
    narrative:
      'You turned around abruptly and bumped straight into Mrs. Higgins! Her grocery bag tumbled and oranges rolled into the gutter.',
    icon: '👵💥',
    isSuccess: false,
  },
  exhausted_wait: {
    title: 'Out of Breath!',
    badge: 'EXHAUSTED',
    badgeColor: 'bg-purple-950 text-purple-400 border border-purple-700',
    headline: 'Collapsed from super-fatigue.',
    narrative:
      'Three sprint bursts pushed you into deep exhaustion. You stood trembling in the rain while time ran out without a bus.',
    icon: '😮‍💨',
    isSuccess: false,
  },
  patient_fail: {
    title: 'Patience Was a Mistake!',
    badge: 'STRANDED',
    badgeColor: 'bg-stone-900 text-stone-400 border border-stone-700',
    headline: 'Waiting without moving failed.',
    narrative:
      'You waited at the bench without moving, but no bus stopped for you before the deadline passed.',
    icon: '⌛',
    isSuccess: false,
  },
  missed_far: {
    title: 'Left Behind',
    badge: 'TOO SLOW',
    badgeColor: 'bg-neutral-900 text-neutral-400 border border-neutral-700',
    headline: 'The bus left without you.',
    narrative:
      'Bus 237 stopped at the shelter, opened its doors, and departed while you were still far down the sidewalk.',
    icon: '🌧️',
    isSuccess: false,
  },
  time_expired: {
    title: 'Time Expired',
    badge: 'TIME OUT',
    badgeColor: 'bg-neutral-900 text-neutral-400 border border-neutral-700',
    headline: 'The departure deadline passed.',
    narrative:
      'The deadline elapsed. The street is empty. You will have to try again for the next bus.',
    icon: '⏱️',
    isSuccess: false,
  },
};

export const RunResultModal: React.FC<RunResultModalProps> = ({
  outcome,
  finalPosition,
  busDetails,
  onRestart,
  onOpenAchievements,
}) => {
  const content = OUTCOME_DETAILS[outcome] || OUTCOME_DETAILS.none;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onRestart();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onRestart]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onRestart}
    >
      <div
        className="w-full max-w-lg bg-neutral-900 border-2 border-neutral-700 rounded-xl p-6 shadow-2xl flex flex-col gap-5 text-neutral-100 font-mono relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Dismiss X Button */}
        <button
          type="button"
          aria-label="Close modal and retry"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRestart();
          }}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer border border-transparent hover:border-neutral-700"
        >
          <X className="w-5 h-5 pointer-events-none" />
        </button>

        {/* Header with Icon and Badge */}
        <div className="flex items-center gap-3 pr-8">
          <span className="text-3xl">{content.icon}</span>
          <div>
            <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${content.badgeColor}`}>
              {content.badge}
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">{content.title}</h2>
          </div>
        </div>

        {/* Headline & Concise Narrative */}
        <div className="bg-neutral-950/70 border border-neutral-800 rounded-lg p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
            {content.headline}
          </p>
          <p className="text-xs leading-relaxed text-neutral-300">
            {content.narrative}
          </p>
        </div>

        {/* Post-Run Telemetry */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-neutral-800/60 p-2.5 rounded border border-neutral-700/60">
            <span className="text-[10px] text-neutral-400 uppercase block">Boarding Zone</span>
            <span className="text-sm font-bold text-neutral-100">
              {finalPosition >= 11.5 ? 'At Shelter Door' : finalPosition >= 6.0 ? 'Halfway Down Sidewalk' : 'Near Starting Bench'}
            </span>
          </div>

          <div className="bg-neutral-800/60 p-2.5 rounded border border-neutral-700/60">
            <span className="text-[10px] text-neutral-400 uppercase block">Bus Observed</span>
            <span className="text-sm font-bold text-amber-300">
              {busDetails ? busDetails.routeName : 'None sighted'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onRestart();
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer text-sm shadow-lg shadow-emerald-950/50"
          >
            <RotateCcw className="w-4 h-4 pointer-events-none" />
            <span>Try Again (Space)</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenAchievements();
            }}
            className="flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-medium py-2.5 px-3.5 rounded-lg transition-colors cursor-pointer text-xs"
            title="View Achievements"
          >
            <Trophy className="w-4 h-4 text-amber-400 pointer-events-none" />
            <span className="hidden sm:inline">Achievements</span>
          </button>
        </div>
      </div>
    </div>
  );
};
