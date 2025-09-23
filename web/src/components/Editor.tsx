import { Crepe } from "@milkdown/crepe";
import { Milkdown, useEditor } from "@milkdown/react";

import "@milkdown/crepe/theme/common/style.css";
import { usePersistSignal } from '@/hooks/usePersistSignal';
import { useEditorTheme, useTheme, THEME, codeThemeMap } from '@/context/themeContext';

export default function MilkdownEditor() {
  const mdContent = usePersistSignal('mdContent', '', 'localStorage');
  const { currentTheme } = useTheme();
  const { currentEditorTheme } = useEditorTheme();

  const isDark = currentTheme.value === THEME.dark ||
    (currentTheme.value === THEME.system && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const codeTheme = codeThemeMap[currentEditorTheme as keyof typeof codeThemeMap];
  const theme = isDark ? codeTheme.dark : codeTheme.light;

  useEditor((root) => {
    const crepe = new Crepe({
      root,
      defaultValue: mdContent.value,
      featureConfigs: {
        [Crepe.Feature.CodeMirror]: {
          theme
        }
      }
    });
    crepe.on((listener) => {
      listener.markdownUpdated((_, markdown) => {
        mdContent.value = markdown;
      });
    });
    return crepe;
  }, [currentTheme.value, currentEditorTheme, theme]);

  return <Milkdown />;
};
