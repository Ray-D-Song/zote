import { useSignal, effect } from '@preact/signals';

type KeyOrPath = string

type PersistLocation = 'localStorage' | 'fs';

interface PersistOptions {
  location: PersistLocation;
}

function usePersistSignal<T>(
  keyOrPath: KeyOrPath,
  initialValue: T,
  location: PersistLocation = 'localStorage'
) {

  // Initialize signal with persisted value or initial value
  const getPersistedValue = (): T => {
    try {
      switch (location) {
        case 'localStorage':
          const stored = localStorage.getItem(keyOrPath);
          return stored ? JSON.parse(stored) : initialValue;
        case 'fs':
          // TODO: Implement file system persistence via API
          console.warn('File system persistence not yet implemented, falling back to localStorage');
          const fsStored = localStorage.getItem(`fs_${keyOrPath}`);
          return fsStored ? JSON.parse(fsStored) : initialValue;
        default:
          return initialValue;
      }
    } catch (error) {
      console.error(`Failed to load persisted value for keyOrPath "${keyOrPath}":`, error);
      return initialValue;
    }
  };

  const sig = useSignal<T>(getPersistedValue());

  // Persist value changes
  effect(() => {
    try {
      switch (location) {
        case 'localStorage':
          localStorage.setItem(keyOrPath, JSON.stringify(sig.value));
          break;
        case 'fs':
          // TODO: Implement file system persistence via API
          console.warn('File system persistence not yet implemented, using localStorage fallback');
          localStorage.setItem(`fs_${keyOrPath}`, JSON.stringify(sig.value));
          break;
      }
    } catch (error) {
      console.error(`Failed to persist value for keyOrPath "${keyOrPath}":`, error);
    }
  });

  return sig;
}

export { usePersistSignal, type PersistLocation, type PersistOptions };