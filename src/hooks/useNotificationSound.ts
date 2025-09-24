import { useRef, useCallback } from 'react';

export type NotificationSoundType = 'bell' | 'classic' | 'modern' | 'sweep' | 'pop';

export const SOUND_TYPE_LABELS = {
  bell: 'Campainha',
  classic: 'Clássico', 
  modern: 'Moderno',
  sweep: 'Sweep',
  pop: 'Pop'
} as const;

const SOUND_FILES = {
  bell: '/sounds/notification-bell.mp3',
  classic: '/sounds/notification-classic.mp3',
  modern: '/sounds/notification-modern.mp3',
  sweep: '/sounds/notification-sweep.mp3',
  pop: '/sounds/notification-pop.mp3'
} as const;

export async function playTestSound(soundType: NotificationSoundType, volume: number = 0.5): Promise<void> {
  try {
    const soundFile = SOUND_FILES[soundType];
    const audio = new Audio(soundFile);
    audio.volume = volume;
    audio.preload = 'auto';
    
    try {
      await audio.play();
    } catch (playError) {
      console.warn(`Erro ao reproduzir som ${soundType}:`, playError);
      throw playError;
    }
  } catch (error) {
    console.warn('Erro ao tocar som de teste:', error);
    throw error;
  }
}

interface UseNotificationSoundOptions {
  volume?: number;
  enabled?: boolean;
  soundType?: NotificationSoundType;
}

export function useNotificationSound(options: UseNotificationSoundOptions = {}) {
  const { volume = 0.5, enabled = true, soundType = 'bell' } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const initializeAudio = useCallback(() => {
    if (!audioRef.current && enabled) {
      try {
        const soundFile = SOUND_FILES[soundType];
        const audio = new Audio(soundFile);
        audio.volume = volume;
        audio.preload = 'auto';
        audioRef.current = audio;
      } catch (error) {
        console.warn('Erro ao inicializar áudio:', error);
      }
    }
  }, [volume, enabled, soundType]);

  const playNotificationSound = useCallback(() => {
    if (!enabled) {
      return;
    }
    
    try {
      initializeAudio();
      
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = volume;
        
        const playPromise = audioRef.current.play();
        
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch((error) => {
            console.warn('Erro ao reproduzir som:', error);
          });
        }
      }
    } catch (error) {
      console.warn('Erro geral ao reproduzir som:', error);
    }
  }, [enabled, initializeAudio, volume]);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  return {
    playNotificationSound,
    cleanup,
    setVolume: (newVolume: number) => {
      if (audioRef.current) {
        audioRef.current.volume = Math.max(0, Math.min(1, newVolume));
      }
    }
  };
}
