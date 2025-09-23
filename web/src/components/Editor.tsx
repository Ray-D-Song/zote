import { Crepe } from "@milkdown/crepe";
import { Milkdown, useEditor } from "@milkdown/react";
import { oneDark } from '@codemirror/theme-one-dark'

import "@milkdown/crepe/theme/common/style.css";
import { usePersistSignal } from '@/hooks/usePersistSignal';

export default function MilkdownEditor() {
  const mdContent = usePersistSignal('mdContent', '', 'localStorage')
  useEditor((root) => {
    const crepe = new Crepe({
      root,
      defaultValue: mdContent.value,
      featureConfigs: {
        [Crepe.Feature.CodeMirror]: {
          theme: oneDark
        }
      }
    });
    crepe.on((listener) => {
      listener.markdownUpdated((_, markdown) => {
        mdContent.value = markdown
      });
    });
    return crepe;
  }, []);

  return <Milkdown />;
};
