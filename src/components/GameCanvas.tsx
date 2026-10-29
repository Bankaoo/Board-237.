/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import {
  ROAD_LENGTH,
  TOTAL_TIME_PER_RUN,
  WALK_SPEED,
  SPRINT_SPEED,
  SPRINT_MAX_DURATION,
  FATIGUE_SPEED,
  FATIGUE_DURATION,
  SUPER_FATIGUE_SPEED,
  SUPER_FATIGUE_DURATION,
  TURN_DURATION,
  BOARDING_DOOR_RANGE,
  SO_CLOSE_DISTANCE,
  PEDESTRIAN_COLLISION_DISTANCE,
} from '../constants/gameRules';
import { MovementState, RunOutcome, BusConfig } from '../types/game';
import { createRunSimulation, RunSimulation } from '../services/busSimulation';
import { soundManager } from '../services/audio';
import { achievementService } from '../services/achievements';

interface GameCanvasProps {
  isPlaying: boolean;
  isPaused: boolean;
  attemptNumber: number;
  onRunFinished: (outcome: RunOutcome, finalPosition: number, busDetails?: BusConfig) => void;
  onTogglePause: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  isPlaying,
  isPaused,
  attemptNumber,
  onRunFinished,
  onTogglePause,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Authoritative Internal Game State
  const gameStateRef = useRef({
    elapsedTime: 0,
    characterPos: 0,
    maxDistanceMoved: 0,
    speed: 0,
    movementState: 'idle' as MovementState,
    
    // Sprint & Fatigue
    isSprinting: false,
    currentSprintDuration: 0,
    completedSprints: 0,
    fatigueTimer: 0,
    superFatigueTimer: 0,
    
    // Turning Around
    turnTimer: 0,
    isTurning: false,
    hasTurned: false,
    
    // Run status
    isFinished: false,
    outcome: 'none' as RunOutcome,
    encounteredFakeBus: false,
    activeBus: null as BusConfig | null,
    
    // Audio cadence tracking
    lastFootstepTime: 0,
    lastPantTime: 0,
    
    // Animation frame counters
    animTick: 0,
    sweatParticles: [] as { x: number; y: number; vx: number; vy: number; life: number }[],
    rainParticles: [] as { x: number; y: number; speed: number; len: number }[],
  });

  const simulationRef = useRef<RunSimulation | null>(null);
  const keysRef = useRef<{ walk: boolean; sprint: boolean }>({ walk: false, sprint: false });

  // Initialize rain particles
  useEffect(() => {
    const rain = [];
    for (let i = 0; i < 75; i++) {
      rain.push({
        x: Math.random() * 640,
        y: Math.random() * 360,
        speed: 7 + Math.random() * 6,
        len: 8 + Math.random() * 10,
      });
    }
    gameStateRef.current.rainParticles = rain;
  }, []);

  // Reset and initialize a new run
  useEffect(() => {
    if (!isPlaying) return;

    achievementService.recordAttemptStart();
    const sim = createRunSimulation(attemptNumber);
    simulationRef.current = sim;

    gameStateRef.current = {
      elapsedTime: 0,
      characterPos: 0,
      maxDistanceMoved: 0,
      speed: 0,
      movementState: 'idle',
      isSprinting: false,
      currentSprintDuration: 0,
      completedSprints: 0,
      fatigueTimer: 0,
      superFatigueTimer: 0,
      turnTimer: 0,
      isTurning: false,
      hasTurned: false,
      isFinished: false,
      outcome: 'none',
      encounteredFakeBus: false,
      activeBus: null,
      lastFootstepTime: 0,
      lastPantTime: 0,
      animTick: 0,
      sweatParticles: [],
      rainParticles: gameStateRef.current.rainParticles,
    };

    soundManager.startAmbience();

    return () => {
      soundManager.stopAmbience();
    };
  }, [isPlaying, attemptNumber]);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        onTogglePause();
        return;
      }

      if (!isPlaying || isPaused || gameStateRef.current.isFinished) return;

      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        e.preventDefault();
        keysRef.current.walk = true;
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        keysRef.current.sprint = true;
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (e.repeat) return;
        
        const state = gameStateRef.current;
        if (state.turnTimer <= 0 && !state.isFinished) {
          if (state.isSprinting) {
            state.completedSprints++;
            state.isSprinting = false;
            state.currentSprintDuration = 0;
            if (state.completedSprints >= 3) {
              state.superFatigueTimer = SUPER_FATIGUE_DURATION;
            } else {
              state.fatigueTimer = FATIGUE_DURATION;
            }
          }

          state.turnTimer = TURN_DURATION;
          state.isTurning = true;
          state.hasTurned = true;
          soundManager.playTurnSwoosh();

          // Check for collision with elderly pedestrian Mrs. Higgins
          if (simulationRef.current) {
            const mrsHiggins = simulationRef.current.pedestrians.find((p) => p.id === 'mrs_higgins');
            if (mrsHiggins) {
              const dist = Math.abs(mrsHiggins.position - state.characterPos);
              if (dist <= PEDESTRIAN_COLLISION_DISTANCE) {
                state.isFinished = true;
                state.outcome = 'pedestrian_collision';
                soundManager.playCollision();
                achievementService.recordCollision();
                onRunFinished('pedestrian_collision', state.characterPos);
              }
            }
          }
        }
      } else if (e.code === 'KeyE' || e.code === 'Enter') {
        e.preventDefault();
        checkBoardBus();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        keysRef.current.walk = false;
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        keysRef.current.sprint = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isPaused, onTogglePause, onRunFinished]);

  // Boarding Check Helper
  const checkBoardBus = () => {
    const state = gameStateRef.current;
    if (state.isFinished || !simulationRef.current) return;

    for (const bus of simulationRef.current.buses) {
      if (bus.doorOpened && !bus.doorClosed) {
        const dist = Math.abs(state.characterPos - bus.stopPosition);
        if (dist <= BOARDING_DOOR_RANGE) {
          state.isFinished = true;
          state.activeBus = bus;
          state.movementState = 'boarding';

          if (bus.isCorrect) {
            const isPatient = state.maxDistanceMoved < 0.2 && bus.stopPosition === 0;
            if (isPatient) {
              state.outcome = 'success_patient';
              soundManager.playSuccess();
              achievementService.recordSuccess(true);
            } else {
              state.outcome = 'success_normal';
              soundManager.playSuccess();
              achievementService.recordSuccess(false);

              if (state.encounteredFakeBus) {
                achievementService.unlock('the_real_deal');
              }
            }
            onRunFinished(state.outcome, state.characterPos, bus);
          } else {
            state.outcome = 'fake_bus';
            soundManager.playFailure();
            achievementService.recordFakeBusBoarded();
            onRunFinished('fake_bus', state.characterPos, bus);
          }
          return;
        }
      }
    }
  };

  // Main Delta-Time Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      if (isPlaying && !isPaused && !gameStateRef.current.isFinished) {
        updateGame(dt);
      }

      renderGame();
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, isPaused]);

  // Authoritative State Machine Update
  const updateGame = (dt: number) => {
    const state = gameStateRef.current;
    const sim = simulationRef.current;
    if (!sim) return;

    state.elapsedTime += dt;
    state.animTick++;

    // 1. Turning Around State
    if (state.turnTimer > 0) {
      state.turnTimer -= dt;
      state.speed = 0;
      state.movementState = 'turning';
      if (state.turnTimer <= 0) {
        state.isTurning = false;
      }
    } else {
      // 2. Sprint & Fatigue State Machine
      const canSprint = state.fatigueTimer <= 0 && state.superFatigueTimer <= 0;

      if (state.superFatigueTimer > 0) {
        state.superFatigueTimer -= dt;
        state.speed = keysRef.current.walk ? SUPER_FATIGUE_SPEED : 0;
        state.movementState = 'super_fatigued';

        if (state.elapsedTime - state.lastPantTime > 0.65) {
          state.lastPantTime = state.elapsedTime;
          soundManager.playPant('heavy');
        }
      } else if (state.fatigueTimer > 0) {
        state.fatigueTimer -= dt;
        state.speed = keysRef.current.walk ? FATIGUE_SPEED : 0;
        state.movementState = 'fatigued';

        if (state.elapsedTime - state.lastPantTime > 1.1) {
          state.lastPantTime = state.elapsedTime;
          soundManager.playPant('medium');
        }
      } else if (keysRef.current.walk) {
        if (keysRef.current.sprint && canSprint && state.currentSprintDuration < SPRINT_MAX_DURATION) {
          state.isSprinting = true;
          state.currentSprintDuration += dt;
          state.speed = SPRINT_SPEED;
          state.movementState = 'sprinting';

          if (state.animTick % 3 === 0) {
            state.sweatParticles.push({
              x: 0,
              y: 0,
              vx: (Math.random() - 0.5) * 2,
              vy: -Math.random() * 2 - 1,
              life: 1.0,
            });
          }

          if (state.currentSprintDuration >= SPRINT_MAX_DURATION) {
            state.completedSprints++;
            state.isSprinting = false;
            state.currentSprintDuration = 0;
            if (state.completedSprints >= 3) {
              state.superFatigueTimer = SUPER_FATIGUE_DURATION;
              state.movementState = 'super_fatigued';
            } else {
              state.fatigueTimer = FATIGUE_DURATION;
              state.movementState = 'fatigued';
            }
          }
        } else {
          if (state.isSprinting) {
            state.completedSprints++;
            state.isSprinting = false;
            state.currentSprintDuration = 0;
            if (state.completedSprints >= 3) {
              state.superFatigueTimer = SUPER_FATIGUE_DURATION;
              state.movementState = 'super_fatigued';
            } else {
              state.fatigueTimer = FATIGUE_DURATION;
              state.movementState = 'fatigued';
            }
          }
          state.speed = WALK_SPEED;
          state.movementState = 'walking';
        }
      } else {
        if (state.isSprinting) {
          state.completedSprints++;
          state.isSprinting = false;
          state.currentSprintDuration = 0;
          if (state.completedSprints >= 3) {
            state.superFatigueTimer = SUPER_FATIGUE_DURATION;
            state.movementState = 'super_fatigued';
          } else {
            state.fatigueTimer = FATIGUE_DURATION;
            state.movementState = 'fatigued';
          }
        }
        state.speed = 0;
        state.movementState = 'idle';
      }

      state.characterPos = Math.min(ROAD_LENGTH, Math.max(0, state.characterPos + state.speed * dt));
      state.maxDistanceMoved = Math.max(state.maxDistanceMoved, state.characterPos);

      if (state.speed > 0) {
        const stepInterval = state.isSprinting ? 0.16 : state.movementState.includes('fatigued') ? 0.48 : 0.32;
        if (state.elapsedTime - state.lastFootstepTime > stepInterval) {
          state.lastFootstepTime = state.elapsedTime;
          const stepType = state.isSprinting ? 'sprint' : state.movementState.includes('fatigued') ? 'drag' : 'walk';
          soundManager.playFootstep(stepType);
        }
      }
    }

    // 4. Update Bus Simulation Events
    for (const bus of sim.buses) {
      // Dynamic stop positioning: Only stop at 0m if player stayed at bench
      if (bus.id === 'bus_overshoot' && state.characterPos > 1.0 && !bus.doorOpened) {
        bus.stopPosition = 13.0;
      }

      if (!bus.doorOpened && state.elapsedTime >= bus.approachTime && state.elapsedTime < bus.arriveTime) {
        if (state.animTick % 60 === 0) {
          soundManager.playBusApproaching();
        }
      }

      if (!bus.doorOpened && state.elapsedTime >= bus.arriveTime) {
        bus.doorOpened = true;
        soundManager.playAirBrake();
        soundManager.playBusDoors();
      }

      if (bus.doorOpened && !bus.doorClosed && state.elapsedTime >= bus.departureTime) {
        bus.doorClosed = true;
        bus.departed = true;
        soundManager.playBusDoors();

        if (!bus.isCorrect) {
          state.encounteredFakeBus = true;
        }

        if (bus.isCorrect && !state.isFinished) {
          const distToDoor = Math.abs(state.characterPos - bus.stopPosition);
          if (distToDoor <= SO_CLOSE_DISTANCE) {
            state.isFinished = true;
            state.outcome = 'so_close';
            soundManager.playFailure();
            achievementService.recordMiss(false, true);
            onRunFinished('so_close', state.characterPos, bus);
            return;
          }
        }
      }

      // Auto-board if player is within range while doors open and walking
      if (bus.doorOpened && !bus.doorClosed && !state.isFinished) {
        const dist = Math.abs(state.characterPos - bus.stopPosition);
        if (dist <= BOARDING_DOOR_RANGE && keysRef.current.walk) {
          checkBoardBus();
          return;
        }
      }
    }

    // 5. Update Pedestrians
    for (const ped of sim.pedestrians) {
      ped.position += ped.direction * ped.speed * dt;
      if (ped.position < 0) {
        ped.position = 0;
        ped.direction = 1;
      } else if (ped.position > 13) {
        ped.position = 13;
        ped.direction = -1;
      }
    }

    // 6. Update Traffic Vehicles
    for (const v of sim.vehicles) {
      v.position += v.speed * dt;
      if (v.position > 50) {
        v.position = -120 - Math.random() * 40;
      }
    }

    // 7. Update Particles
    for (let i = state.sweatParticles.length - 1; i >= 0; i--) {
      const p = state.sweatParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= dt * 2.5;
      if (p.life <= 0) {
        state.sweatParticles.splice(i, 1);
      }
    }

    // 8. Deadline Check
    if (state.elapsedTime >= TOTAL_TIME_PER_RUN && !state.isFinished) {
      state.isFinished = true;

      const primaryBus = sim.buses.find((b) => b.isCorrect) || sim.buses[0];
      const distToBoarding = Math.abs(state.characterPos - (primaryBus ? primaryBus.stopPosition : 13.0));

      if (distToBoarding <= SO_CLOSE_DISTANCE) {
        state.outcome = 'so_close';
        soundManager.playFailure();
        achievementService.recordMiss(false, true);
      } else if (state.maxDistanceMoved < 0.2) {
        state.outcome = 'patient_fail';
        soundManager.playFailure();
        achievementService.recordMiss(true, false);
      } else if (state.completedSprints >= 3 || state.superFatigueTimer > 0) {
        state.outcome = 'exhausted_wait';
        soundManager.playFailure();
        achievementService.unlock('out_of_breath');
      } else if (primaryBus && primaryBus.doorOpened) {
        state.outcome = 'missed_far';
        soundManager.playFailure();
        achievementService.recordMiss(false, false);
      } else {
        state.outcome = 'time_expired';
        soundManager.playFailure();
        achievementService.recordMiss(false, false);
      }

      onRunFinished(state.outcome, state.characterPos, primaryBus);
    }
  };

  // Rendering Loop (640 x 360 pixel virtual resolution)
  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const state = gameStateRef.current;
    const sim = simulationRef.current;

    // Clear Canvas with rich night blue
    ctx.fillStyle = '#061325';
    ctx.fillRect(0, 0, 640, 360);

    if (state.isTurning) {
      renderTurnAroundView(ctx, state, sim);
    } else {
      renderForwardView(ctx, state, sim);
    }

    renderRain(ctx, state);
  };

  // Render Mode 1: Forward-Facing View (Zoomed-In, Atmospheric, Coherent)
  const renderForwardView = (
    ctx: CanvasRenderingContext2D,
    state: typeof gameStateRef.current,
    sim: RunSimulation | null
  ) => {
    const HORIZON_Y = 145;

    // 1. Deep Teal & Blue Night Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
    skyGrad.addColorStop(0, '#06162a');
    skyGrad.addColorStop(0.65, '#0c2e47');
    skyGrad.addColorStop(1, '#114a68');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 640, HORIZON_Y);

    // 2. Coherent City Skyline with Depth & Warm Lit Windows
    drawCitySkyline(ctx, state.animTick, HORIZON_Y);

    // Warm city atmospheric haze along the horizon
    const hazeGrad = ctx.createLinearGradient(0, HORIZON_Y - 40, 0, HORIZON_Y + 15);
    hazeGrad.addColorStop(0, 'rgba(245, 158, 11, 0)');
    hazeGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.16)');
    hazeGrad.addColorStop(1, 'rgba(12, 46, 71, 0.4)');
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, HORIZON_Y - 40, 640, 55);

    // 3. Ground Plane: Road (Left) & Sidewalk (Right)
    // Road on Left: from x=0 to x=265 at horizon, widening to x=0 to x=275 at bottom
    ctx.fillStyle = '#161e2b'; // Dark wet asphalt
    ctx.beginPath();
    ctx.moveTo(0, HORIZON_Y);
    ctx.lineTo(265, HORIZON_Y);
    ctx.lineTo(275, 360);
    ctx.lineTo(0, 360);
    ctx.closePath();
    ctx.fill();

    // Road subtle surface sheen
    ctx.fillStyle = '#1c2636';
    ctx.beginPath();
    ctx.moveTo(0, HORIZON_Y + 15);
    ctx.lineTo(266, HORIZON_Y + 15);
    ctx.lineTo(275, 360);
    ctx.lineTo(0, 360);
    ctx.closePath();
    ctx.fill();

    // White Dashed Center Lane Marking along road
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 12]);
    ctx.beginPath();
    ctx.moveTo(130, HORIZON_Y);
    ctx.lineTo(135, 360);
    ctx.stroke();
    ctx.setLineDash([]);

    // Bright Amber Tactile Curb Edge separating Road and Sidewalk
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(268, HORIZON_Y, 4, 215);
    ctx.fillStyle = '#475569';
    ctx.fillRect(272, HORIZON_Y, 6, 215);

    // Sidewalk on Right: x=278 to x=640
    ctx.fillStyle = '#2d3b4e';
    ctx.fillRect(278, HORIZON_Y, 362, 215);

    // Concrete Slab Grid Seams (Perspective rows)
    ctx.strokeStyle = '#222d3d';
    ctx.lineWidth = 1.5;
    for (let y = HORIZON_Y + 22; y < 360; y += 32) {
      ctx.beginPath();
      ctx.moveTo(278, y);
      ctx.lineTo(640, y);
      ctx.stroke();
    }
    // Longitudinal seam
    ctx.beginPath();
    ctx.moveTo(450, HORIZON_Y);
    ctx.lineTo(460, 360);
    ctx.stroke();

    // Tactile warning bumps along sidewalk curb
    ctx.fillStyle = '#d97706';
    for (let y = HORIZON_Y + 4; y < 360; y += 10) {
      ctx.fillRect(281, y, 5, 6);
    }

    // Perspective mapping for Y along sidewalk from 0m to 13m
    // Zoomed in: 0m is at y=295 (near bottom), 13m is at y=175 (near shelter)
    const posToY = (pos: number) => {
      const clamped = Math.max(0, Math.min(ROAD_LENGTH, pos));
      const t = clamped / ROAD_LENGTH;
      return 295 - t * 120;
    };

    // Puddles on sidewalk with warm light reflections
    drawPuddle(ctx, 360, 245, 45, 14, state.animTick, 'rgba(251, 191, 36, 0.35)');
    drawPuddle(ctx, 510, 310, 60, 18, state.animTick, 'rgba(56, 189, 248, 0.25)');

    // Street Furniture (Cleaned up: No red warning circle, No red fire hydrant!)
    // 1. Waiting Bench at 0.0m (Start)
    drawBench(ctx, 480, posToY(0.2));

    // 2. Streetlight at 6.0m casting warm amber light pool
    drawStreetLamp(ctx, 390, posToY(6.0), state.animTick);

    // 3. Glass Bus Shelter at 13.0m (Official Boarding Point)
    drawBusShelter(ctx, 320, posToY(13.0), state.animTick);

    // 4. Draw Pedestrians
    if (sim) {
      for (const ped of sim.pedestrians) {
        const pedY = posToY(ped.position);
        const pedX = ped.type === 'elderly' ? 360 : 430;
        drawPedestrian(ctx, ped, pedX, pedY, state.animTick);
      }
    }

    // 5. Draw Buses (Approaching, Stopped, and Departing strictly within road)
    if (sim) {
      for (const bus of sim.buses) {
        drawBusInForwardView(ctx, bus, state, posToY, HORIZON_Y);
      }
    }

    // 6. Draw Player Character from behind
    const charY = posToY(state.characterPos);
    const charX = 350;
    drawPlayerFromBehind(ctx, charX, charY, state);
  };

  // Render Mode 2: Turn-Around View (Looking back down the avenue behind character)
  const renderTurnAroundView = (
    ctx: CanvasRenderingContext2D,
    state: typeof gameStateRef.current,
    sim: RunSimulation | null
  ) => {
    // Rich gradient night sky and street
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 240);
    bgGrad.addColorStop(0, '#061325');
    bgGrad.addColorStop(0.6, '#0d283f');
    bgGrad.addColorStop(1, '#152538');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 640, 240);

    // Road receding into perspective distance
    ctx.fillStyle = '#0a1019';
    ctx.beginPath();
    ctx.moveTo(320, 75);
    ctx.lineTo(40, 360);
    ctx.lineTo(600, 360);
    ctx.closePath();
    ctx.fill();

    // Wet asphalt
    ctx.fillStyle = '#161e2b';
    ctx.beginPath();
    ctx.moveTo(320, 80);
    ctx.lineTo(100, 360);
    ctx.lineTo(500, 360);
    ctx.closePath();
    ctx.fill();

    // Road center dashes receding
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(320, 85);
    ctx.lineTo(300, 360);
    ctx.stroke();

    // Receding street lamps
    for (let i = 1; i <= 6; i++) {
      const t = i / 6;
      const lx = 320 - t * 190;
      const rx = 320 + t * 190;
      const ly = 80 + t * 180;
      const size = 3 + t * 6;

      ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.beginPath();
      ctx.arc(lx, ly, size * 2.2, 0, Math.PI * 2);
      ctx.arc(rx, ly, size * 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.fillRect(lx - size / 2, ly - size / 2, size, size);
      ctx.fillRect(rx - size / 2, ly - size / 2, size, size);
    }

    // Approaching Traffic Vehicles behind character
    if (sim) {
      for (const v of sim.vehicles) {
        const laneOffset = v.lane === 0 ? -40 : 40;
        const dist = 30 - (v.position % 40);
        if (dist > 2 && dist < 45) {
          const depthT = Math.max(0.12, 1 - dist / 45);
          const vx = 320 + laneOffset * depthT * 2.8;
          const vy = 85 + depthT * 155;
          const vWidth = 28 * depthT;
          const vHeight = 18 * depthT;

          // Headlight glare
          const glareGrad = ctx.createRadialGradient(vx, vy, 1, vx, vy, 40 * depthT);
          glareGrad.addColorStop(0, 'rgba(254, 240, 138, 0.8)');
          glareGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = glareGrad;
          ctx.beginPath();
          ctx.arc(vx, vy, 40 * depthT, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = v.color;
          ctx.fillRect(vx - vWidth / 2, vy - vHeight / 2, vWidth, vHeight);

          // Headlights
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(vx - vWidth / 2 + 2, vy - 2, 4 * depthT, 4 * depthT);
          ctx.fillRect(vx + vWidth / 2 - 2 - 4 * depthT, vy - 2, 4 * depthT, 4 * depthT);
        }
      }
    }

    // Approaching Bus behind the player
    if (sim) {
      for (const bus of sim.buses) {
        if (state.elapsedTime >= bus.approachTime && state.elapsedTime < bus.arriveTime) {
          const t = (state.elapsedTime - bus.approachTime) / (bus.arriveTime - bus.approachTime);
          const depthT = Math.min(1.0, Math.max(0.15, t));

          const bx = 260 - (1 - depthT) * 40;
          const by = 85 + depthT * 155;
          const bw = 80 * depthT;
          const bh = 62 * depthT;

          // Headlight beam cones
          ctx.fillStyle = 'rgba(254, 243, 199, 0.35)';
          ctx.beginPath();
          ctx.moveTo(bx - bw * 0.3, by);
          ctx.lineTo(bx - bw * 1.1, 360);
          ctx.lineTo(bx + bw * 1.1, 360);
          ctx.lineTo(bx + bw * 0.3, by);
          ctx.closePath();
          ctx.fill();

          // Bus body (Standard green for both real and decoy!)
          ctx.fillStyle = bus.busColor;
          ctx.fillRect(bx - bw / 2, by - bh, bw, bh);

          // Roof
          ctx.fillStyle = '#334155';
          ctx.fillRect(bx - bw / 2, by - bh, bw, bh * 0.15);

          // Glowing Destination LED Sign!
          ctx.fillStyle = '#090d16';
          ctx.fillRect(bx - bw * 0.42, by - bh * 0.9, bw * 0.84, bh * 0.26);
          ctx.fillStyle = '#fbbf24';
          ctx.font = `bold ${Math.max(9, Math.round(12 * depthT))}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(bus.routeName, bx, by - bh * 0.71);

          // Windshield
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(bx - bw * 0.42, by - bh * 0.62, bw * 0.84, bh * 0.32);

          // Twin Bright Headlights
          ctx.fillStyle = '#fffbeb';
          ctx.fillRect(bx - bw * 0.4, by - bh * 0.25, bw * 0.22, bh * 0.2);
          ctx.fillRect(bx + bw * 0.18, by - bh * 0.25, bw * 0.22, bh * 0.2);
        }
      }
    }

    // Nearby Pedestrian (Mrs. Higgins)
    if (sim) {
      const mrsHiggins = sim.pedestrians.find((p) => p.id === 'mrs_higgins');
      if (mrsHiggins) {
        const dist = Math.abs(mrsHiggins.position - state.characterPos);
        if (dist < 3.5) {
          const hx = 440 + (mrsHiggins.position - state.characterPos) * 30;
          const hy = 230;
          drawElderlyPedestrianFace(ctx, hx, hy, dist < PEDESTRIAN_COLLISION_DISTANCE);
        }
      }
    }

    // Foreground Player Character looking over shoulder
    drawPlayerFacingCamera(ctx, 320, 270, state);

    // Frame indicator
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 632, 352);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(240, 14, 160, 24);
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('◄ LOOKING BEHIND ►', 320, 30);
  };

  // Coherent Skyline Architecture with Depth & Ambient Light
  const drawCitySkyline = (ctx: CanvasRenderingContext2D, tick: number, horizonY: number) => {
    // 1. Far silhouette layer (Deep indigo/teal)
    ctx.fillStyle = '#081c30';
    ctx.fillRect(20, horizonY - 100, 60, 100);
    ctx.fillRect(110, horizonY - 125, 75, 125);
    ctx.fillRect(220, horizonY - 90, 80, 90);
    ctx.fillRect(340, horizonY - 135, 70, 135);
    ctx.fillRect(450, horizonY - 110, 85, 110);
    ctx.fillRect(560, horizonY - 95, 70, 95);

    // Radio antenna on far towers
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(147, horizonY - 125);
    ctx.lineTo(147, horizonY - 145);
    ctx.moveTo(375, horizonY - 135);
    ctx.lineTo(375, horizonY - 155);
    ctx.stroke();

    // Blinking red beacons
    if (Math.sin(tick * 0.1) > 0) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(145, horizonY - 147, 4, 4);
      ctx.fillRect(373, horizonY - 157, 4, 4);
    }

    // 2. Midground urban buildings with rich warm lit windows & architecture
    const buildings = [
      { x: 0, w: 90, h: 85, color: '#0e243a', trim: '#153655', winCols: 3, winRows: 4 },
      { x: 88, w: 105, h: 110, color: '#102b45', trim: '#184268', winCols: 4, winRows: 6, sign: '24H' },
      { x: 190, w: 85, h: 75, color: '#0d2238', trim: '#153352', winCols: 3, winRows: 3 },
      { x: 272, w: 125, h: 120, color: '#133352', trim: '#1b4873', winCols: 5, winRows: 7, waterTank: true },
      { x: 395, w: 95, h: 90, color: '#0e2740', trim: '#163b5e', winCols: 3, winRows: 5, sign: 'METRO' },
      { x: 488, w: 152, h: 105, color: '#112f4c', trim: '#19456e', winCols: 6, winRows: 6 },
    ];

    buildings.forEach((b) => {
      // Main wall
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, horizonY - b.h, b.w, b.h);

      // Roof cornice trim
      ctx.fillStyle = b.trim;
      ctx.fillRect(b.x - 2, horizonY - b.h, b.w + 4, 5);

      // Water Tank on roof
      if (b.waterTank) {
        ctx.fillStyle = '#475569';
        ctx.fillRect(b.x + 20, horizonY - b.h - 18, 22, 18);
        ctx.fillRect(b.x + 24, horizonY - b.h - 22, 14, 4);
      }

      // Neon sign on building
      if (b.sign) {
        ctx.fillStyle = b.sign === '24H' ? '#38bdf8' : '#fbbf24';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(b.sign, b.x + 12, horizonY - b.h + 14);
      }

      // Warm glowing windows
      for (let r = 0; r < b.winRows; r++) {
        const wy = horizonY - b.h + 20 + r * 13;
        for (let c = 0; c < b.winCols; c++) {
          const wx = b.x + 10 + c * 16;
          // Deterministic pattern so windows stay steady
          const isLit = (wx * 11 + wy * 17) % 7 > 2;
          if (isLit) {
            ctx.fillStyle = (wx + wy) % 5 === 0 ? 'rgba(56, 189, 248, 0.85)' : 'rgba(254, 240, 138, 0.85)';
            ctx.fillRect(wx, wy, 8, 7);
          } else {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
            ctx.fillRect(wx, wy, 8, 7);
          }
        }
      }
    });
  };

  // Natural Puddle with Shimmer & Reflections
  const drawPuddle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    tick: number,
    reflectColor: string
  ) => {
    ctx.fillStyle = '#162232';
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Soft light reflection streak
    ctx.fillStyle = reflectColor;
    ctx.beginPath();
    ctx.ellipse(x - 2, y, w * 0.35, h * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shimmer ring
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
    ctx.lineWidth = 1;
    const ripple = (w * 0.2) * (0.5 + 0.5 * Math.sin(tick * 0.05 + x));
    ctx.beginPath();
    ctx.ellipse(x, y, ripple, ripple * (h / w), 0, 0, Math.PI * 2);
    ctx.stroke();
  };

  // Waiting Bench at 0m (Clean dark green wood & cast iron)
  const drawBench = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x + 22, y + 2, 26, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cast iron legs
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 2, y - 12, 5, 18);
    ctx.fillRect(x + 38, y - 12, 5, 18);

    // Dark green wooden bench slats
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(x - 4, y - 18, 52, 5);
    ctx.fillRect(x - 4, y - 11, 52, 5);
    ctx.fillRect(x - 2, y - 4, 48, 5);

    // Warm wet wood highlight
    ctx.fillStyle = '#10b981';
    ctx.fillRect(x - 4, y - 18, 52, 1);
  };

  // Ornate Streetlamp at 6m casting warm amber light pool
  const drawStreetLamp = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    tick: number
  ) => {
    // Warm circular amber pool of light on ground
    const flicker = 0.95 + 0.05 * Math.sin(tick * 0.1);
    const lampGrad = ctx.createRadialGradient(x - 12, y, 6, x - 12, y, 80 * flicker);
    lampGrad.addColorStop(0, 'rgba(251, 191, 36, 0.28)');
    lampGrad.addColorStop(0.6, 'rgba(251, 191, 36, 0.1)');
    lampGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = lampGrad;
    ctx.beginPath();
    ctx.ellipse(x - 12, y, 70, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cast iron lamp post
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 2, y - 65, 5, 65);
    // Base pedestal
    ctx.fillRect(x - 5, y - 6, 11, 6);
    // Arm extending over sidewalk/curb
    ctx.fillRect(x - 18, y - 68, 20, 5);

    // Glowing Lantern housing
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 18, y - 63, 10, 3);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x - 17, y - 60, 8, 7);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x - 18, y - 53, 10, 2);
  };

  // Glass Bus Shelter at 13m (Clean, Coherent Transit Architecture)
  const drawBusShelter = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    tick: number
  ) => {
    // Shelter Roof
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 10, y - 55, 95, 7);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x - 10, y - 55, 95, 2); // Teal roof edge trim

    // Steel Pillars
    ctx.fillStyle = '#475569';
    ctx.fillRect(x - 8, y - 48, 5, 48);
    ctx.fillRect(x + 78, y - 48, 5, 48);

    // Glass panel with raindrops reflection
    ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.fillRect(x - 3, y - 48, 81, 46);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 3, y - 48, 81, 46);

    // Glowing digital timetable display
    ctx.fillStyle = '#090d16';
    ctx.fillRect(x + 8, y - 44, 46, 18);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('237 DUE', x + 11, y - 31);

    // Clean official route pole with rectangular plate
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x + 92, y - 65, 4, 65);
    // Official route placard
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 86, y - 65, 16, 20);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(x + 88, y - 63, 12, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('237', x + 94, y - 52);

    // Boarding area pavement hash marks along curb
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x - 15, y - 2, 25, 3);
    ctx.fillRect(x + 15, y - 2, 25, 3);
  };

  // Pedestrians on Sidewalk
  const drawPedestrian = (
    ctx: CanvasRenderingContext2D,
    ped: RunSimulation['pedestrians'][0],
    x: number,
    y: number,
    tick: number
  ) => {
    const bob = Math.sin(tick * 0.16) * 1.5;

    if (ped.type === 'elderly') {
      // Mrs. Higgins
      // Hair bun
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.arc(x, y - 24 + bob, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Cardigan
      ctx.fillStyle = '#a5b4fc'; // Soft periwinkle cardigan
      ctx.fillRect(x - 6, y - 19 + bob, 12, 14);

      // Cane
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 7, y - 11 + bob);
      ctx.lineTo(x + 8, y + 1);
      ctx.stroke();

      // Grocery bag with oranges
      ctx.fillStyle = '#b45309';
      ctx.fillRect(x - 10, y - 15 + bob, 6, 9);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(x - 9, y - 17 + bob, 4, 4);
    } else {
      // Commuter
      ctx.fillStyle = '#334155';
      ctx.fillRect(x - 4, y - 24 + bob, 8, 8);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x - 6, y - 16 + bob, 12, 16);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + 4, y - 9 + bob, 3, 5);
    }
  };

  // Draw Bus strictly constrained to Road Corridor (4.5 Fixed!)
  const drawBusInForwardView = (
    ctx: CanvasRenderingContext2D,
    bus: BusConfig,
    state: typeof gameStateRef.current,
    posToY: (pos: number) => number,
    horizonY: number
  ) => {
    if (state.elapsedTime < bus.approachTime) return;

    // Bus strictly stays on the road corridor between x=40 and x=260
    const targetY = posToY(bus.stopPosition);
    let busY = targetY;
    let busX = 140;
    let scale = 1.0;
    let opacity = 1.0;

    if (state.elapsedTime < bus.arriveTime) {
      // Approaching from bottom along the road lane
      const t = (state.elapsedTime - bus.approachTime) / (bus.arriveTime - bus.approachTime);
      busY = 380 - t * (380 - targetY);
      busX = 140;
    } else if (bus.departed) {
      // DEPARTING: Follows the road lane toward the road horizon, NEVER crossing into buildings!
      const departTime = state.elapsedTime - bus.departureTime;
      const progress = Math.min(1.0, departTime / 1.8);
      
      // Accelerates down the road lane toward road horizon (never above horizonY!)
      busY = targetY - progress * (targetY - horizonY);
      // Perspective scale shrinks naturally into road horizon
      scale = Math.max(0.35, 1.0 - progress * 0.65);
      // Fades smoothly into the distant rain mist as it reaches the end of the road
      opacity = Math.max(0, 1.0 - progress * 1.1);
    }

    if (opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = opacity;

    const bw = 105 * scale;
    const bh = 68 * scale;
    const bx = busX - bw / 2;

    // Bus shadow on wet asphalt
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(bx - 6, busY + 2, bw + 12, 10 * scale);

    // Headlight beams along wet asphalt
    ctx.fillStyle = 'rgba(254, 240, 138, 0.2)';
    ctx.beginPath();
    ctx.moveTo(bx + 10, busY);
    ctx.lineTo(bx - 20, busY - 60 * scale);
    ctx.lineTo(bx + bw + 20, busY - 60 * scale);
    ctx.lineTo(bx + bw - 10, busY);
    ctx.closePath();
    ctx.fill();

    // Bus Body (Transit green)
    ctx.fillStyle = bus.busColor;
    ctx.fillRect(bx, busY - bh, bw, bh);

    // Silver roof
    ctx.fillStyle = '#64748b';
    ctx.fillRect(bx, busY - bh, bw, 8 * scale);

    // Glowing LED Marquee Sign
    ctx.fillStyle = '#090d16';
    ctx.fillRect(bx + 14 * scale, busY - bh + 10 * scale, bw - 28 * scale, 14 * scale);
    ctx.fillStyle = '#fbbf24';
    ctx.font = `bold ${Math.max(7, Math.round(10 * scale))}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(bus.routeName, bx + bw / 2, busY - bh + 21 * scale);

    // Amber Interior Windows
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(bx + 10 * scale, busY - bh + 28 * scale, 22 * scale, 18 * scale);
    ctx.fillRect(bx + 38 * scale, busY - bh + 28 * scale, 22 * scale, 18 * scale);

    // Passenger silhouettes
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(bx + 21 * scale, busY - bh + 37 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.arc(bx + 49 * scale, busY - bh + 37 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Boarding Doors (on the right side of bus, facing sidewalk)
    const doorW = 24 * scale;
    const doorH = bh - 24 * scale;
    const doorX = bx + bw - doorW - 4 * scale;
    const doorY = busY - bh + 24 * scale;

    if (bus.doorOpened && !bus.doorClosed) {
      // Warm yellow interior light pool spilling onto sidewalk pavement!
      const spillGrad = ctx.createRadialGradient(doorX + doorW / 2, busY, 2, doorX + doorW / 2, busY, 40 * scale);
      spillGrad.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
      spillGrad.addColorStop(0.7, 'rgba(254, 240, 138, 0.25)');
      spillGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = spillGrad;
      ctx.beginPath();
      ctx.ellipse(doorX + doorW / 2 + 10 * scale, busY, 32 * scale, 14 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bi-fold open glass panels
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(doorX, doorY, 5 * scale, doorH);
      ctx.fillRect(doorX + doorW - 5 * scale, doorY, 5 * scale, doorH);

      // Open illuminated staircase step well
      ctx.fillStyle = '#334155';
      ctx.fillRect(doorX + 5 * scale, doorY + 6 * scale, doorW - 10 * scale, doorH - 6 * scale);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(doorX + 5 * scale, busY - 4 * scale, doorW - 10 * scale, 4 * scale);
    } else {
      // Closed doors
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(doorX, doorY, doorW, doorH);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(doorX + doorW / 2 - 1, doorY, 2, doorH);
      ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
      ctx.fillRect(doorX + 3 * scale, doorY + 4 * scale, 7 * scale, 16 * scale);
      ctx.fillRect(doorX + 14 * scale, doorY + 4 * scale, 7 * scale, 16 * scale);
    }

    ctx.restore();
  };

  // Draw Player from behind (Zoomed-in, Distinct & Expressive)
  const drawPlayerFromBehind = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state: typeof gameStateRef.current
  ) => {
    ctx.save();

    let bob = 0;
    let sway = 0;
    let sweat = false;
    let superSweat = false;
    let hunched = false;

    if (state.movementState === 'sprinting') {
      bob = Math.sin(state.animTick * 0.5) * 3.5;
      sway = Math.cos(state.animTick * 0.5) * 2.5;
    } else if (state.movementState === 'walking') {
      bob = Math.sin(state.animTick * 0.25) * 2.2;
      sway = Math.cos(state.animTick * 0.25) * 1.8;
    } else if (state.movementState === 'fatigued') {
      hunched = true;
      sweat = true;
      bob = Math.sin(state.animTick * 0.12) * 3.0;
    } else if (state.movementState === 'super_fatigued') {
      hunched = true;
      sweat = true;
      superSweat = true;
      bob = Math.sin(state.animTick * 0.08) * 4.0;
      sway = (Math.random() - 0.5) * 2.5;
    } else {
      bob = Math.sin(state.animTick * 0.06) * 1.2;
    }

    const py = y + bob;
    const px = x + sway;

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(px, y + 2, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boots
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px - 6, py - 4, 5, 6);
    ctx.fillRect(px + 2, py - 4, 5, 6);

    // Trousers / Legs
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px - 6, py - 16, 5, 13);
    ctx.fillRect(px + 2, py - 16, 5, 13);

    // Trench Coat (Teal / Navy)
    ctx.fillStyle = hunched ? '#0e3a5a' : '#0284c7';
    if (hunched) {
      ctx.fillRect(px - 10, py - 30, 20, 16);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px + 12, py - 32 + (state.animTick % 10), 3, 3);
      if (superSweat) {
        ctx.fillRect(px - 13, py - 28 + (state.animTick % 8), 3, 4);
      }
    } else {
      ctx.fillRect(px - 9, py - 32, 18, 18);
    }

    // Leather messenger bag across back
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(px - 5, py - 26, 12, 10);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px - 9, py - 31);
    ctx.lineTo(px + 7, py - 20);
    ctx.stroke();

    // Beanie from behind
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.arc(px, py - 37, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Dark hair tips
    ctx.fillStyle = '#18181b';
    ctx.fillRect(px - 5, py - 33, 10, 3);

    // Active sweat particles
    for (const p of state.sweatParticles) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.fillRect(px + p.x, py - 32 + p.y, 2.5, 2.5);
    }

    ctx.restore();
  };

  // Draw Player Facing Camera (Turned Around)
  const drawPlayerFacingCamera = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state: typeof gameStateRef.current
  ) => {
    // Shoulders & Coat
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.ellipse(x, y + 55, 52, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Scarf
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 16, y + 28, 32, 22);

    // Head
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.arc(x, y + 10, 22, 0, Math.PI * 2);
    ctx.fill();

    // Beanie
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.arc(x, y + 2, 23, Math.PI, 0);
    ctx.fill();

    // Wide Anxious Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 13, y + 8, 9, 8);
    ctx.fillRect(x + 4, y + 8, 9, 8);

    // Pupils
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 10, y + 10, 4, 4);
    ctx.fillRect(x + 6, y + 10, 4, 4);

    // Worried eyebrows
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 14, y + 4);
    ctx.lineTo(x - 4, y + 7);
    ctx.moveTo(x + 14, y + 4);
    ctx.lineTo(x + 4, y + 7);
    ctx.stroke();

    // Mouth
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(x - 5, y + 23, 10, 2);

    // Sweat drop
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(x + 16, y + 15, 3, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawElderlyPedestrianFace = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isColliding: boolean
  ) => {
    ctx.fillStyle = '#a5b4fc';
    ctx.beginPath();
    ctx.ellipse(x, y + 32, 28, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(x, y + 12, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.arc(x, y - 1, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 10, y + 9, 7, 6);
    ctx.strokeRect(x + 3, y + 9, 7, 6);
    ctx.beginPath();
    ctx.moveTo(x - 3, y + 12);
    ctx.lineTo(x + 3, y + 12);
    ctx.stroke();

    if (isColliding) {
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(x - 20, y - 10, 5, 0, Math.PI * 2);
      ctx.arc(x + 20, y - 5, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('💥 OOF!', x - 18, y - 24);
    }
  };

  // Render Atmospheric Rain Streaks
  const renderRain = (ctx: CanvasRenderingContext2D, state: typeof gameStateRef.current) => {
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.32)';
    ctx.lineWidth = 1;

    for (const drop of state.rainParticles) {
      drop.y += drop.speed;
      drop.x -= 1.6;
      if (drop.y > 360) {
        drop.y = -10;
        drop.x = Math.random() * 660;
      }
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 2, drop.y + drop.len);
      ctx.stroke();
    }
  };

  return (
    <div className="relative w-full aspect-video bg-neutral-950 rounded-lg overflow-hidden shadow-2xl border border-neutral-800">
      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        className="w-full h-full object-contain block image-rendering-pixelated cursor-default select-none"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};
