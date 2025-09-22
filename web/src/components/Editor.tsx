import { Crepe } from "@milkdown/crepe";
import { Milkdown, useEditor } from "@milkdown/react";

import "@milkdown/crepe/theme/common/style.css";
import '@/themes/crep-dark.css'

const markdown = `# Milkdown React Crepe

> You're scared of a world where you're needed.

This is a demo for using Crepe with **React**.`;

export default function MilkdownEditor() {
  useEditor((root) => {
    const crepe = new Crepe({
      root,
      defaultValue: markdown,
    });
    return crepe;
  }, []);

  return <Milkdown />;
};
