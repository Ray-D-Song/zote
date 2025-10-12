import type { MarkViewConstructor } from '@milkdown/prose/view'
import { languages } from '@codemirror/language-data'
import { commandsCtx } from '@milkdown/core'
import { CrepeBuilder } from '@milkdown/crepe/builder'
import { blockEdit } from '@milkdown/crepe/feature/block-edit'
import { codeMirror } from '@milkdown/crepe/feature/code-mirror'
import { cursor } from '@milkdown/crepe/feature/cursor'
import { imageBlock } from '@milkdown/crepe/feature/image-block'
import { latex } from '@milkdown/crepe/feature/latex'
import { linkTooltip } from '@milkdown/crepe/feature/link-tooltip'
import { placeholder } from '@milkdown/crepe/feature/placeholder'
import { table } from '@milkdown/crepe/feature/table'
import { toolbar } from '@milkdown/crepe/feature/toolbar'
import { listenerCtx } from '@milkdown/plugin-listener'
import { clearTextInCurrentBlockCommand, linkSchema } from '@milkdown/preset-commonmark'
import { Milkdown, useEditor } from '@milkdown/react'
import { $view, insert } from '@milkdown/utils'

import { codeThemeMap, THEME, useEditorTheme, useTheme } from '@/context/themeContext'
import { usePersistSignal } from '@/hooks/usePersistSignal'
import '@milkdown/crepe/theme/common/style.css'

const customLinkView = $view(linkSchema.mark, () => {
  const markViewConstructor: MarkViewConstructor = (mark) => {
    const href = mark.attrs.href || ''

    // Check if it's a relative path to a markdown file
    const isRelativeMdLink = href.startsWith('./') && href.endsWith('.md')

    if (isRelativeMdLink) {
      const span = document.createElement('span')
      span.className = 'relative-md-link'
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
      `

      const fileIcon = document.createElement('span')
      fileIcon.textContent = '📄'
      fileIcon.style.fontSize = '14px'

      const textNode = document.createElement('span')
      span.appendChild(fileIcon)
      span.appendChild(textNode)

      return {
        dom: span,
        contentDOM: textNode,
      }
    }

    // For non-relative md links, use default link rendering
    const a = document.createElement('a')
    a.href = href
    a.target = mark.attrs.target || '_blank'
    a.rel = 'noopener noreferrer'

    return {
      dom: a,
      contentDOM: a,
    }
  }

  return markViewConstructor
})

export default function MilkdownEditor(props: { className: string }) {
  const mdContent = usePersistSignal('mdContent', '', 'localStorage')
  const { currentTheme } = useTheme()
  const { currentEditorTheme } = useEditorTheme()

  const isDark = currentTheme.value === THEME.dark
    || (currentTheme.value === THEME.system && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const codeTheme = codeThemeMap[currentEditorTheme as keyof typeof codeThemeMap]
  const theme = isDark ? codeTheme.dark : codeTheme.light

  useEditor((root) => {
    const builder = new CrepeBuilder({
      root,
      defaultValue: mdContent.value,
    })

    // Add core features to match Crepe functionality
    builder
      .addFeature(codeMirror, {
        theme,
        languages,
      })
      .addFeature(blockEdit, {
        buildMenu: (builder) => {
          builder.getGroup('text').addItem('new-page', {
            label: 'New Page',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="256px" height="256px" viewBox="0 0 24 24"><path fill="currentColor" d="m16 15l3-3l-1.05-1.075l-1.2 1.2V9h-1.5v3.125l-1.2-1.2L13 12zM4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h16q.825 0 1.413.588T22 6v12q0 .825-.587 1.413T20 20zm0-2h16V6H4zm0 0V6zm1.5-3H7v-4.5h1v3h1.5v-3h1V15H12v-5q0-.425-.288-.712T11 9H6.5q-.425 0-.712.288T5.5 10z"/></svg>',
            onRun: (ctx) => {
              const commands = ctx.get(commandsCtx)
              commands.call(clearTextInCurrentBlockCommand.key)
              insert('[新页面](./)')(ctx)
            },
          })
        },
      })
      .addFeature(toolbar)
      .addFeature(cursor)
      .addFeature(linkTooltip)
      .addFeature(placeholder, {
        text: '输入文本，按 / 启用指令...',
      })
      .addFeature(latex)
      .addFeature(table)
      .addFeature(imageBlock)

    // Add custom link view to the underlying editor
    builder.editor.use(customLinkView)

    // Add markdown update listener
    builder.editor.config((ctx) => {
      const listener = ctx.get(listenerCtx)
      listener.markdownUpdated((_, markdown) => {
        mdContent.value = markdown
      })
    })

    return builder
  }, [currentTheme.value, currentEditorTheme, theme])

  return (
    <section className={`relative ${props.className}`}>
      <input
        placeholder="新页面"
        class="[caret-width:3px] absolute left-60px top-40px z-20 h-48px border-none bg-transparent text-4xl text-black font-600 caret-blue-500 lg:left-180px lg:top-80px xl:left-240px xl:top-120px focus:border-none hover:border-none dark:text-gray-300 dark:caret-blue-400 focus:outline-none"
      />
      <Milkdown />
    </section>
  )
};
