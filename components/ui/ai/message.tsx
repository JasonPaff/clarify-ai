'use client';

import type { FileUIPart, UIMessage } from 'ai';
import type { ComponentProps, ComponentPropsWithRef, HTMLAttributes, ReactElement, ReactNode } from 'react';

import { ChevronLeftIcon, ChevronRightIcon, PaperclipIcon, XIcon } from 'lucide-react';
import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  memo,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Streamdown } from 'streamdown';

import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type SafeParagraphProps = ComponentPropsWithRef<'p'>;

/**
 * Check if any children contain block-level elements that cannot be inside <p>
 */
function hasBlockChildren(children: ReactNode): boolean {
  return Children.toArray(children).some((child) => {
    if (!isValidElement(child)) return false;
    const type = child.type;
    if (typeof type === 'string') {
      const blockElements = ['div', 'pre', 'ul', 'ol', 'table', 'blockquote', 'figure', 'hr', 'form', 'fieldset'];
      return blockElements.includes(type);
    }
    const props = child.props as Record<string, unknown> | undefined;
    if (props) {
      const dataStreamdown = props['data-streamdown'];
      if (
        typeof dataStreamdown === 'string' &&
        (dataStreamdown.includes('code-block') || dataStreamdown.includes('list'))
      ) {
        return true;
      }
      if (props.children) {
        return hasBlockChildren(props.children as ReactNode);
      }
    }
    return false;
  });
}

/**
 * Custom paragraph component that uses <div> when children contain block-level elements.
 */
function SafeParagraph({ children, ...props }: SafeParagraphProps) {
  const useDiv = hasBlockChildren(children);
  if (useDiv) {
    return <div {...props}>{children}</div>;
  }
  return <p {...props}>{children}</p>;
}

const streamdownComponents = { p: SafeParagraph };

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role'];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn('group flex w-full max-w-[95%] flex-col gap-2', from === 'user' && 'ml-auto justify-end', className)}
    data-role={from}
    {...props}
  />
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({ children, className, ...props }: MessageContentProps) => (
  <div
    className={cn(
      'flex w-fit max-w-full min-w-0 flex-col gap-2 overflow-hidden text-sm text-foreground',
      // eslint-disable-next-line better-tailwindcss/no-unknown-classes -- data attribute selectors are valid
      'group-data-[role=user]:bg-secondary group-data-[role=user]:ml-auto group-data-[role=user]:rounded-lg group-data-[role=user]:px-4 group-data-[role=user]:py-3',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export type MessageActionsProps = ComponentProps<'div'>;

export const MessageActions = ({ children, className, ...props }: MessageActionsProps) => (
  <div className={cn('flex items-center gap-1', className)} {...props}>
    {children}
  </div>
);

export type MessageActionProps = ComponentProps<typeof Button> & {
  label?: string;
  tooltip?: string;
};

export const MessageAction = ({
  children,
  label,
  size = 'icon-sm',
  tooltip,
  variant = 'ghost',
  ...props
}: MessageActionProps) => {
  const button = (
    <Button size={size} type={'button'} variant={variant} {...props}>
      {children}
      <span className={'sr-only'}>{label || tooltip}</span>
    </Button>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{button}</Tooltip>;
  }

  return button;
};

interface MessageBranchContextType {
  branches: Array<ReactElement>;
  currentBranch: number;
  onGoToNext: () => void;
  onGoToPrevious: () => void;
  setBranches: (branches: Array<ReactElement>) => void;
  totalBranches: number;
}

const MessageBranchContext = createContext<MessageBranchContextType | null>(null);

const useMessageBranch = () => {
  const context = useContext(MessageBranchContext);

  if (!context) {
    throw new Error('MessageBranch components must be used within MessageBranch');
  }

  return context;
};

export type MessageBranchProps = HTMLAttributes<HTMLDivElement> & {
  defaultBranch?: number;
  onBranchChange?: (branchIndex: number) => void;
};

export const MessageBranch = ({ className, defaultBranch = 0, onBranchChange, ...props }: MessageBranchProps) => {
  const [currentBranch, setCurrentBranch] = useState(defaultBranch);
  const [branches, setBranches] = useState<Array<ReactElement>>([]);

  const handleBranchChange = (newBranch: number) => {
    setCurrentBranch(newBranch);
    onBranchChange?.(newBranch);
  };

  const handleGoToPrevious = () => {
    const newBranch = currentBranch > 0 ? currentBranch - 1 : branches.length - 1;
    handleBranchChange(newBranch);
  };

  const handleGoToNext = () => {
    const newBranch = currentBranch < branches.length - 1 ? currentBranch + 1 : 0;
    handleBranchChange(newBranch);
  };

  const contextValue: MessageBranchContextType = {
    branches,
    currentBranch,
    onGoToNext: handleGoToNext,
    onGoToPrevious: handleGoToPrevious,
    setBranches,
    totalBranches: branches.length,
  };

  return (
    <MessageBranchContext.Provider value={contextValue}>
      <div className={cn('grid w-full gap-2 [&>div]:pb-0', className)} {...props} />
    </MessageBranchContext.Provider>
  );
};

export type MessageBranchContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageBranchContent = ({ children, ...props }: MessageBranchContentProps) => {
  const { branches, currentBranch, setBranches } = useMessageBranch();
  const childrenArray = useMemo(() => (Array.isArray(children) ? children : [children]), [children]);

  useEffect(() => {
    if (branches.length !== childrenArray.length) {
      setBranches(childrenArray);
    }
  }, [childrenArray, branches, setBranches]);

  return childrenArray.map((branch, index) => (
    <div
      className={cn('grid gap-2 overflow-hidden [&>div]:pb-0', index === currentBranch ? 'block' : 'hidden')}
      key={branch.key}
      {...props}
    >
      {branch}
    </div>
  ));
};

export type MessageBranchSelectorProps = HTMLAttributes<HTMLDivElement>;

export const MessageBranchSelector = (props: MessageBranchSelectorProps) => {
  const { totalBranches } = useMessageBranch();

  if (totalBranches <= 1) {
    return null;
  }

  return (
    <ButtonGroup
      className={'[&>*:not(:first-child)]:rounded-l-md [&>*:not(:last-child)]:rounded-r-md'}
      orientation={'horizontal'}
      {...props}
    />
  );
};

export type MessageBranchPreviousProps = ComponentProps<typeof Button>;

export const MessageBranchPrevious = ({ children, ...props }: MessageBranchPreviousProps) => {
  const { onGoToPrevious, totalBranches } = useMessageBranch();

  return (
    <Button
      aria-label={'Previous branch'}
      disabled={totalBranches <= 1}
      onClick={onGoToPrevious}
      size={'icon-sm'}
      type={'button'}
      variant={'ghost'}
      {...props}
    >
      {children ?? <ChevronLeftIcon size={14} />}
    </Button>
  );
};

export type MessageBranchNextProps = ComponentProps<typeof Button>;

export const MessageBranchNext = ({ children, ...props }: MessageBranchNextProps) => {
  const { onGoToNext, totalBranches } = useMessageBranch();

  return (
    <Button
      aria-label={'Next branch'}
      disabled={totalBranches <= 1}
      onClick={onGoToNext}
      size={'icon-sm'}
      type={'button'}
      variant={'ghost'}
      {...props}
    >
      {children ?? <ChevronRightIcon size={14} />}
    </Button>
  );
};

export type MessageBranchPageProps = HTMLAttributes<HTMLSpanElement>;

export const MessageBranchPage = ({ className, ...props }: MessageBranchPageProps) => {
  const { currentBranch, totalBranches } = useMessageBranch();

  return (
    <ButtonGroupText
      className={cn('border-none bg-transparent text-muted-foreground shadow-none', className)}
      {...props}
    >
      {currentBranch + 1} of {totalBranches}
    </ButtonGroupText>
  );
};

export type MessageResponseProps = ComponentProps<typeof Streamdown>;

export const MessageResponse = memo(
  ({ className, ...props }: MessageResponseProps) => (
    <Streamdown
      className={cn('size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0', className)}
      components={streamdownComponents}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

MessageResponse.displayName = 'MessageResponse';

export type MessageAttachmentProps = HTMLAttributes<HTMLDivElement> & {
  className?: string;
  data: FileUIPart;
  onRemove?: () => void;
};

export type MessageAttachmentsProps = ComponentProps<'div'>;

export type MessageToolbarProps = ComponentProps<'div'>;

export function MessageAttachment({ className, data, onRemove, ...props }: MessageAttachmentProps) {
  const filename = data.filename || '';
  const mediaType = data.mediaType?.startsWith('image/') && data.url ? 'image' : 'file';
  const isImage = mediaType === 'image';
  const attachmentLabel = filename || (isImage ? 'Image' : 'Attachment');

  return (
    <div className={cn('group relative size-24 overflow-hidden rounded-lg', className)} {...props}>
      {isImage ? (
        <Fragment>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={filename || 'attachment'}
            className={'size-full object-cover'}
            height={100}
            src={data.url}
            width={100}
          />
          {onRemove && (
            <Button
              aria-label={'Remove attachment'}
              className={
                'absolute top-2 right-2 size-6 rounded-full bg-background/80 p-0 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-background [&>svg]:size-3'
              }
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              type={'button'}
              variant={'ghost'}
            >
              <XIcon />
              <span className={'sr-only'}>Remove</span>
            </Button>
          )}
        </Fragment>
      ) : (
        <Fragment>
          <Tooltip content={attachmentLabel}>
            <div
              className={
                'flex size-full shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'
              }
            >
              <PaperclipIcon className={'size-4'} />
            </div>
          </Tooltip>
          {onRemove && (
            <Button
              aria-label={'Remove attachment'}
              className={
                'size-6 shrink-0 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent [&>svg]:size-3'
              }
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              type={'button'}
              variant={'ghost'}
            >
              <XIcon />
              <span className={'sr-only'}>Remove</span>
            </Button>
          )}
        </Fragment>
      )}
    </div>
  );
}

export function MessageAttachments({ children, className, ...props }: MessageAttachmentsProps) {
  if (!children) {
    return null;
  }

  return (
    <div className={cn('ml-auto flex w-fit flex-wrap items-start gap-2', className)} {...props}>
      {children}
    </div>
  );
}

export const MessageToolbar = ({ children, className, ...props }: MessageToolbarProps) => (
  <div className={cn('mt-4 flex w-full items-center justify-between gap-4', className)} {...props}>
    {children}
  </div>
);
