/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Achievement, GameStats } from '../types/game';
import { soundManager } from './audio';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'made_it',
    title: 'Made It!',
    description: 'Successfully board the correct bus (Bus 237).',
    icon: '🚌',
    unlocked: false,
  },
  {
    id: 'wrong_time_to_look',
    title: 'Wrong Time to Look',
    description: 'Turn around and collide with an elderly pedestrian.',
    icon: '👵',
    unlocked: false,
  },
  {
    id: 'so_close',
    title: 'So Close',
    description: 'Miss the bus by one step.',
    icon: '🤏',
    unlocked: false,
  },
  {
    id: 'out_of_breath',
    title: 'Out of Breath',
    description: 'Sprint repeatedly, become exhausted, and then remain at the stop for an unusually long time without a bus arriving.',
    icon: '😮‍💨',
    unlocked: false,
  },
  {
    id: 'patience_pays_off',
    title: 'Patience Pays Off',
    description: 'Stay in place and successfully catch the bus without ever moving.',
    icon: '🧘',
    unlocked: false,
  },
  {
    id: 'patience_was_a_mistake',
    title: 'Patience Was a Mistake',
    description: 'Stay in place and fail to catch a bus.',
    icon: '⌛',
    unlocked: false,
  },
  {
    id: 'fake_ride',
    title: 'Fake Ride',
    description: 'Board the wrong bus.',
    icon: '🎭',
    unlocked: false,
  },
  {
    id: 'the_real_deal',
    title: 'The Real Deal',
    description: 'Board the correct bus after encountering a fake bus.',
    icon: '🌟',
    unlocked: false,
  },
];

const ACHIEVEMENTS_STORAGE_KEY = 'board237_achievements_v1';
const STATS_STORAGE_KEY = 'board237_stats_v1';

export class AchievementService {
  private achievements: Achievement[] = [];
  private stats: GameStats = {
    totalAttempts: 0,
    successfulBoardings: 0,
    missedBuses: 0,
    fakeBusesBoarded: 0,
    pedestrianCollisions: 0,
    patientBoardings: 0,
    soCloseCount: 0,
  };
  private onAchievementUnlocked?: (achievement: Achievement) => void;

  constructor() {
    this.loadFromStorage();
  }

  public setUnlockListener(cb: (achievement: Achievement) => void) {
    this.onAchievementUnlocked = cb;
  }

  private loadFromStorage() {
    try {
      const savedAch = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
      if (savedAch) {
        const parsed = JSON.parse(savedAch) as Record<string, { unlocked: boolean; unlockedAt?: string }>;
        this.achievements = INITIAL_ACHIEVEMENTS.map((item) => ({
          ...item,
          unlocked: parsed[item.id]?.unlocked ?? false,
          unlockedAt: parsed[item.id]?.unlockedAt,
        }));
      } else {
        this.achievements = [...INITIAL_ACHIEVEMENTS];
      }

      const savedStats = localStorage.getItem(STATS_STORAGE_KEY);
      if (savedStats) {
        this.stats = { ...this.stats, ...JSON.parse(savedStats) };
      }
    } catch {
      this.achievements = [...INITIAL_ACHIEVEMENTS];
    }
  }

  private saveToStorage() {
    try {
      const achMap: Record<string, { unlocked: boolean; unlockedAt?: string }> = {};
      this.achievements.forEach((a) => {
        achMap[a.id] = { unlocked: a.unlocked, unlockedAt: a.unlockedAt };
      });
      localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achMap));
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(this.stats));
    } catch {
      // Storage unavailable fallback
    }
  }

  public getAchievements(): Achievement[] {
    return [...this.achievements];
  }

  public getStats(): GameStats {
    return { ...this.stats };
  }

  public recordAttemptStart() {
    this.stats.totalAttempts++;
    this.saveToStorage();
  }

  public recordSuccess(isPatient: boolean) {
    this.stats.successfulBoardings++;
    if (isPatient) {
      this.stats.patientBoardings++;
      this.unlock('patience_pays_off');
    } else {
      this.unlock('made_it');
    }
    this.saveToStorage();
  }

  public recordFakeBusBoarded() {
    this.stats.fakeBusesBoarded++;
    this.unlock('fake_ride');
    this.saveToStorage();
  }

  public recordCollision() {
    this.stats.pedestrianCollisions++;
    this.unlock('wrong_time_to_look');
    this.saveToStorage();
  }

  public recordMiss(isPatient: boolean, isSoClose: boolean) {
    this.stats.missedBuses++;
    if (isSoClose) {
      this.stats.soCloseCount++;
      this.unlock('so_close');
    } else if (isPatient) {
      this.unlock('patience_was_a_mistake');
    }
    this.saveToStorage();
  }

  public unlock(id: string): boolean {
    const ach = this.achievements.find((a) => a.id === id);
    if (ach && !ach.unlocked) {
      ach.unlocked = true;
      ach.unlockedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.saveToStorage();
      soundManager.playAchievement();
      if (this.onAchievementUnlocked) {
        this.onAchievementUnlocked(ach);
      }
      return true;
    }
    return false;
  }

  public resetAchievements() {
    this.achievements = INITIAL_ACHIEVEMENTS.map((item) => ({ ...item, unlocked: false, unlockedAt: undefined }));
    this.saveToStorage();
  }
}

export const achievementService = new AchievementService();
