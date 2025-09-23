import { createContext, ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';
import { effect } from '@preact/signals';
import { usePersistSignal } from '../hooks/usePersistSignal';
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode';
import { xcodeLight, xcodeDark } from '@uiw/codemirror-theme-xcode';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import { nord } from '@uiw/codemirror-theme-nord'

export enum THEME {
  light = 'light',
  dark = 'dark',
  system = 'system'
}

export interface EditorTheme {
  value: string;
  label: string;
}

export interface ThemeContextValue {
  // System theme
  currentTheme: ReturnType<typeof usePersistSignal<THEME>>;
  changeTheme: (value: THEME) => void;
  themes: { label: string; value: THEME }[];

  // Editor theme
  currentEditorTheme: string;
  changeEditorTheme: (value: string) => void;
  editorThemes: EditorTheme[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const editorThemes: EditorTheme[] = [
  { value: 'crep', label: 'Crep' },
  { value: 'frame', label: 'Frame' },
  { value: 'nord', label: 'Nord' },
  { value: 'vscode-modern', label: 'VSCode Modern' }
];

export const codeThemeMap = {
  ['crep']: {
    light: xcodeLight,
    dark: xcodeDark
  },
  ['frame']: {
    light: githubLight,
    dark: githubDark
  },
  ['vscode-modern']: {
    light: vscodeLight,
    dark: vscodeDark
  },
  ['nord']: {
    light: nord,
    dark: nord
  }
}

export function ThemeProvider({ children }: { children: ComponentChildren }) {
  const currentTheme = usePersistSignal('theme', THEME.system, 'localStorage');
  const currentEditorTheme = usePersistSignal('editor-theme', 'crep', 'localStorage');

  const applySystemTheme = (isDark: boolean) => {
    const body = document.body;

    if (isDark) {
      body.setAttribute('theme-mode', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      body.removeAttribute('theme-mode');
      document.documentElement.classList.remove('dark');
    }
  };

  const applyEditorTheme = (baseTheme: string, isDark: boolean) => {
    // Remove existing theme link
    const existingLink = document.querySelector('link[data-theme]');
    if (existingLink) {
      existingLink.remove();
    }

    // Determine the actual theme file to load
    let themeFile = baseTheme;
    if (isDark) {
      themeFile = `${baseTheme}-dark`;
    }

    // Add new theme link
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `/src/themes/${themeFile}.css`;
    link.setAttribute('data-theme', themeFile);
    document.head.appendChild(link);
  };

  // Auto-apply themes based on system theme changes
  effect(() => {
    const isDark = currentTheme.value === THEME.dark ||
      (currentTheme.value === THEME.system && window.matchMedia('(prefers-color-scheme: dark)').matches);

    applySystemTheme(isDark);
    applyEditorTheme(currentEditorTheme.value, isDark);

    // Listen for system theme changes when using system theme
    if (currentTheme.value === THEME.system) {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');

      const handleSystemChange = (e: MediaQueryListEvent) => {
        if (currentTheme.value === THEME.system) {
          applySystemTheme(e.matches);
          applyEditorTheme(currentEditorTheme.value, e.matches);
        }
      };

      mql.addEventListener('change', handleSystemChange);

      return () => {
        mql.removeEventListener('change', handleSystemChange);
      };
    }
  });

  const changeTheme = (value: THEME) => {
    currentTheme.value = value;
  };

  const changeEditorTheme = (value: string) => {
    currentEditorTheme.value = value;
  };

  const contextValue: ThemeContextValue = {
    currentTheme,
    changeTheme,
    themes: [
      { label: 'Light', value: THEME.light },
      { label: 'Dark', value: THEME.dark },
      { label: '跟随系统', value: THEME.system }
    ],
    currentEditorTheme: currentEditorTheme.value,
    changeEditorTheme,
    editorThemes
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return {
    currentTheme: context.currentTheme,
    changeTheme: context.changeTheme,
    themes: context.themes
  };
}

export function useEditorTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useEditorTheme must be used within a ThemeProvider');
  }

  return {
    currentEditorTheme: context.currentEditorTheme,
    changeEditorTheme: context.changeEditorTheme,
    editorThemes: context.editorThemes
  };
}