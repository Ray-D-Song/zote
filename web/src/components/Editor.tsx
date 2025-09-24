import { CrepeBuilder } from "@milkdown/crepe/builder";
import { Milkdown, useEditor } from "@milkdown/react";
import { $view, insert } from "@milkdown/utils";
import { commandsCtx } from "@milkdown/core";
import { clearTextInCurrentBlockCommand } from "@milkdown/preset-commonmark";
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
      .addFeature(blockEdit, {
        buildMenu: (builder) => {
          builder.getGroup('text').addItem('new-page', {
            label: 'New Page',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="256px" height="256px" viewBox="0 0 24 24"><path fill="currentColor" d="m16 15l3-3l-1.05-1.075l-1.2 1.2V9h-1.5v3.125l-1.2-1.2L13 12zM4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h16q.825 0 1.413.588T22 6v12q0 .825-.587 1.413T20 20zm0-2h16V6H4zm0 0V6zm1.5-3H7v-4.5h1v3h1.5v-3h1V15H12v-5q0-.425-.288-.712T11 9H6.5q-.425 0-.712.288T5.5 10z"/></svg>',
            onRun: (ctx) => {
              const commands = ctx.get(commandsCtx);
              commands.call(clearTextInCurrentBlockCommand.key);
              insert('[新页面](./)')(ctx);
            },
          })
        },
      })
      .addFeature(toolbar)
      .addFeature(cursor)
      .addFeature(linkTooltip)
      .addFeature(placeholder, {
        text: '输入文本，按 / 启用指令...'
      })
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

  return <section class="relative">
    <input
      placeholder="新页面"
      class="border-none h-48px text-4xl font-600 hover:border-none focus:border-none focus:outline-none bg-transparent absolute z-20
             left-60px top-40px
             lg:left-180px lg:top-80px
             xl:left-240px xl:top-120px
             dark:text-gray-300 text-black
             caret-blue-500 dark:caret-blue-400
             [caret-width:3px]
             "
    />
    <Milkdown />
  </section>;
};
