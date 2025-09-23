import { CrepeBuilder } from "@milkdown/crepe/builder";
import { Milkdown, useEditor } from "@milkdown/react";
import { $view } from "@milkdown/utils";
import { linkSchema } from "@milkdown/preset-commonmark";
import { MarkViewConstructor } from "@milkdown/prose/view";
import { listenerCtx } from "@milkdown/plugin-listener";
import { codeMirror } from "@milkdown/crepe/feature/code-mirror";
import { blockEdit } from "@milkdown/crepe/feature/block-edit";
import { toolbar } from "@milkdown/crepe/feature/toolbar";
import { cursor } from "@milkdown/crepe/feature/cursor";
import { linkTooltip } from "@milkdown/crepe/feature/link-tooltip";
import { placeholder } from "@milkdown/crepe/feature/placeholder";
import { latex } from "@milkdown/crepe/feature/latex";
import { table } from "@milkdown/crepe/feature/table";
import { imageBlock } from "@milkdown/crepe/feature/image-block";
import { languages } from "@codemirror/language-data";

import "@milkdown/crepe/theme/common/style.css";
import { usePersistSignal } from '@/hooks/usePersistSignal';
import { useEditorTheme, useTheme, THEME, codeThemeMap } from '@/context/themeContext';

const customLinkView = $view(linkSchema.mark, () => {
  const markViewConstructor: MarkViewConstructor = (mark) => {
    const href = mark.attrs.href || '';

    // Check if it's a relative path to a markdown file
    const isRelativeMdLink = href.startsWith('./') && href.endsWith('.md');

    if (isRelativeMdLink) {
      const span = document.createElement('span');
      span.className = 'relative-md-link';
      span.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: #0066cc;
        text-decoration: none;
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 4px;
        background-color: rgba(0, 102, 204, 0.1);
      `;

      const fileIcon = document.createElement('span');
      fileIcon.textContent = '📄';
      fileIcon.style.fontSize = '14px';

      const textNode = document.createElement('span');
      span.appendChild(fileIcon);
      span.appendChild(textNode);

      return {
        dom: span,
        contentDOM: textNode
      };
    }

    // For non-relative md links, use default link rendering
    const a = document.createElement('a');
    a.href = href;
    a.target = mark.attrs.target || '_blank';
    a.rel = 'noopener noreferrer';

    return {
      dom: a,
      contentDOM: a
    };
  };

  return markViewConstructor;
});

export default function MilkdownEditor() {
  const mdContent = usePersistSignal('mdContent', '', 'localStorage');
  const { currentTheme } = useTheme();
  const { currentEditorTheme } = useEditorTheme();

  const isDark = currentTheme.value === THEME.dark ||
    (currentTheme.value === THEME.system && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const codeTheme = codeThemeMap[currentEditorTheme as keyof typeof codeThemeMap];
  const theme = isDark ? codeTheme.dark : codeTheme.light;

  useEditor((root) => {
    const builder = new CrepeBuilder({
      root,
      defaultValue: mdContent.value,
    });

    // Add core features to match Crepe functionality
    builder
      .addFeature(codeMirror, {
        theme,
        languages
      })
      .addFeature(blockEdit)
      .addFeature(toolbar)
      .addFeature(cursor)
      .addFeature(linkTooltip)
      .addFeature(placeholder)
      .addFeature(latex)
      .addFeature(table)
      .addFeature(imageBlock);

    // Add custom link view to the underlying editor
    builder.editor.use(customLinkView);

    // Add markdown update listener
    builder.editor.config((ctx) => {
      const listener = ctx.get(listenerCtx);
      listener.markdownUpdated((_, markdown) => {
        mdContent.value = markdown;
      });
    });

    return builder;
  }, [currentTheme.value, currentEditorTheme, theme]);

  return <Milkdown />;
};
