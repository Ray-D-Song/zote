import { BlockEditFeatureConfig } from '@milkdown/crepe/feature/block-edit';

// Custom block edit configuration with Sub Page option
export const customBlockEditConfig: Partial<BlockEditFeatureConfig> = {
  blocks: [
    {
      id: 'divider',
      content: 'Divider',
      onSelect: ({ commands }) => {
        commands.addHr?.();
      },
    },
    {
      id: 'bullet-list',
      content: 'Bullet list',
      onSelect: ({ commands }) => {
        commands.wrapInBulletList?.();
      },
    },
    {
      id: 'ordered-list',
      content: 'Ordered list',
      onSelect: ({ commands }) => {
        commands.wrapInOrderedList?.();
      },
    },
    {
      id: 'task-list',
      content: 'Task list',
      onSelect: ({ commands }) => {
        commands.turnIntoTaskList?.();
      },
    },
    {
      id: 'image',
      content: 'Image',
      onSelect: ({ commands }) => {
        commands.addImage?.();
      },
    },
    {
      id: 'code',
      content: 'Code',
      onSelect: ({ commands }) => {
        commands.addCodeBlock?.();
      },
    },
    {
      id: 'table',
      content: 'Table',
      onSelect: ({ commands }) => {
        commands.addTable?.();
      },
    },
    {
      id: 'math',
      content: 'Math',
      onSelect: ({ commands }) => {
        commands.addMathBlock?.();
      },
    },
    {
      id: 'sub-page',
      content: 'Sub Page',
      onSelect: ({ view, pos }) => {
        // Insert []() at the current position
        const tr = view.state.tr.insertText('[]()');
        view.dispatch(tr);

        // Move cursor inside the brackets
        const newPos = pos + 1;
        const selection = view.state.selection.constructor.near(
          view.state.doc.resolve(newPos)
        );
        view.dispatch(view.state.tr.setSelection(selection));
      },
    },
  ],
};