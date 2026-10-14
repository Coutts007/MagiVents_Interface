import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, ChevronDown, ChevronUp, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import {
  AssistantAction,
  AssistantRequestError,
  AssistantSuggestion,
  assistantApi,
  SERVER_ERROR_MESSAGE
} from '../../services/api';
import {
  ACTION_LABELS,
  actionAvailability,
  ApplyMode,
  AssistantFormState,
  hasIdea,
  isBlankForm
} from '../../utils/assistant';
import { formatKES } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ThreadMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  /** Assistant messages only */
  status?: 'streaming' | 'done' | 'error';
  suggestions?: AssistantSuggestion[];
  sample?: boolean;
  error?: string;
  retryable?: boolean;
  /** What to send again when Retry is pressed */
  retry?: { action: AssistantAction };
  /** A local prompt from the panel itself, never sent to the server */
  local?: boolean;
}

export interface AssistantPanelProps {
  /** A snapshot of the form's content fields, read at the moment each request is sent */
  getFormState: () => AssistantFormState;
  /** Writes a suggestion into the form; only called when the organizer clicks */
  onApply: (suggestion: AssistantSuggestion, mode: ApplyMode) => void;
  onClose: () => void;
  /** False while the panel is hidden (it stays mounted so the conversation is kept) */
  visible?: boolean;
}

const QUICK_ACTIONS = Object.keys(ACTION_LABELS) as Exclude<AssistantAction, 'chat'>[];
const FIELD_NAMES: Record<AssistantSuggestion['field'], string> = {
  title: 'Title',
  tagline: 'Tagline',
  description: 'Description',
  category: 'Category',
  agenda: 'Agenda',
  tags: 'Tags',
  tiers: 'Ticket types',
  attendeeNote: 'Note to attendees'
};

let messageCounter = 0;

/**
 * The event-form assistant: quick actions, a chat thread with streamed replies, and suggestion cards that write
 * into the form only when the organizer clicks. The conversation lives in this component's state, so it ends
 * when the editor closes.
 */
export const AssistantPanel: React.FC<AssistantPanelProps> = ({ getFormState, onApply, onClose, visible = true }) => {
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [input, setInput] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [isSample, setIsSample] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [applied, setApplied] = useState<Record<string, boolean>>({});
  // A quick action waiting for the organizer to describe their idea first (blank form)
  const [pendingAction, setPendingAction] = useState<Exclude<AssistantAction, 'chat'> | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (visible) inputRef.current?.focus();
  }, [visible]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'end' });
  }, [thread]);

  const form = getFormState();
  const userWords = thread.filter((m) => m.role === 'user').map((m) => m.content);
  const idea = hasIdea(userWords);
  const needsIdea = isBlankForm(form) && !idea;

  const updateMessage = (id: number, change: (m: ThreadMessage) => ThreadMessage) =>
    setThread((prev) => prev.map((m) => (m.id === id ? change(m) : m)));

  /** Sends the conversation (with `history` as the messages so far) and streams the answer into a new message. */
  const send = async (history: ThreadMessage[], action: AssistantAction) => {
    const reply: ThreadMessage = { id: ++messageCounter, role: 'assistant', content: '', status: 'streaming', retry: { action } };
    setThread([...history, reply]);
    setIsBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await assistantApi.ask(
        {
          messages: history
            .filter((m) => !m.local && m.status !== 'error' && m.content.trim())
            .map((m) => ({ role: m.role, content: m.content })),
          formState: { ...getFormState() },
          action
        },
        {
          onMeta: (meta) => setIsSample(meta.sample),
          onDelta: (text) => updateMessage(reply.id, (m) => ({ ...m, content: m.content + text })),
          onReset: () => updateMessage(reply.id, (m) => ({ ...m, content: '' }))
        },
        controller.signal
      );
      setIsSample(result.sample);
      updateMessage(reply.id, (m) => ({
        ...m,
        content: result.reply,
        status: 'done',
        suggestions: result.suggestions,
        sample: result.sample
      }));
      setAnnouncement(
        `Assistant replied${result.suggestions.length ? ` with ${result.suggestions.length} suggestion${result.suggestions.length === 1 ? '' : 's'}` : ''}.`
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const error = err instanceof AssistantRequestError ? err : new AssistantRequestError(SERVER_ERROR_MESSAGE);
      updateMessage(reply.id, (m) => ({ ...m, status: 'error', error: error.message, retryable: error.retryable }));
      setAnnouncement(`The assistant could not answer: ${error.message}`);
    } finally {
      setIsBusy(false);
      abortRef.current = null;
    }
  };

  const runAction = (action: Exclude<AssistantAction, 'chat'>) => {
    if (isBusy) return;
    if (needsIdea) {
      // A blank form: ask for the idea in one line before generating anything
      setPendingAction(action);
      setThread((prev) => [
        ...prev,
        {
          id: ++messageCounter,
          role: 'assistant',
          content: `Before I ${ACTION_LABELS[action].toLowerCase()}, describe your event in one line: what it is, who it is for and where.`,
          status: 'done',
          local: true
        }
      ]);
      inputRef.current?.focus();
      return;
    }
    send([...thread, { id: ++messageCounter, role: 'user', content: ACTION_LABELS[action] }], action);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;
    setInput('');
    const action = pendingAction ?? 'chat';
    setPendingAction(null);
    send([...thread, { id: ++messageCounter, role: 'user', content: text }], action);
  };

  const retry = (message: ThreadMessage) => {
    const index = thread.findIndex((m) => m.id === message.id);
    if (index < 0 || !message.retry) return;
    send(thread.slice(0, index), message.retry.action);
  };

  const apply = (key: string, suggestion: AssistantSuggestion, mode: ApplyMode = 'replace') => {
    onApply(suggestion, mode);
    setApplied((prev) => ({ ...prev, [key]: true }));
  };

  return (
    <section
      aria-label="Event assistant"
      className="flex flex-col bg-ivory border border-[#D8CDBC] shadow-sand-xl rounded-t-3xl lg:rounded-3xl overflow-hidden flex-1 min-h-0"
    >
      <div aria-hidden="true" className="h-[3px] bg-brand-gold shrink-0" />
      <header className="px-4 py-3 border-b border-[#D8CDBC] bg-[#E9E2D6]/40 flex items-center gap-2 shrink-0">
        <Sparkles className="w-4 h-4 text-[#8A4F33]" aria-hidden="true" />
        <h4 className="font-serif text-lg text-[#1E1814] flex-1">Assistant</h4>
        {isSample && (
          <Badge variant="sand" size="sm">
            Sample suggestions
          </Badge>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand the assistant' : 'Minimise the assistant'}
          className="lg:hidden p-1.5 rounded-full text-[#675A50] hover:text-[#1E1814] hover:bg-[#D8CDBC]/60 cursor-pointer"
        >
          {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the assistant"
          className="p-1.5 rounded-full text-[#675A50] hover:text-[#1E1814] hover:bg-[#D8CDBC]/60 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      <div className={`${collapsed ? 'hidden lg:flex' : 'flex'} flex-col flex-1 min-h-0`}>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" aria-busy={isBusy}>
          <div className="text-xs text-[#675A50] leading-relaxed space-y-3">
            <p>
              Describe your event idea, or pick a quick action. Suggestions use what is already in the form, and nothing
              changes in the form until you choose <strong className="text-[#1E1814]">Use this</strong>.
            </p>
            <div role="group" aria-label="Quick actions" className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((action) => {
                const availability = needsIdea ? { enabled: true } : actionAvailability(action, form, idea);
                const hint = 'hint' in availability ? availability.hint : undefined;
                return (
                  <button
                    key={action}
                    type="button"
                    disabled={!availability.enabled || isBusy}
                    onClick={() => runAction(action)}
                    title={hint}
                    aria-describedby={hint ? `hint-${action}` : undefined}
                    className="px-2.5 py-1 rounded-full border border-[#D8CDBC] bg-ivory text-[11px] font-medium text-[#1E1814] hover:border-[#8A4F33] hover:text-[#8A4F33] disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:border-[#D8CDBC] disabled:hover:text-[#1E1814] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A4F33]"
                  >
                    {ACTION_LABELS[action]}
                    {hint && (
                      <span id={`hint-${action}`} className="block text-[10px] font-normal text-[#675A50]">
                        {hint}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <ol className="space-y-4">
            {thread.map((message) => (
              <li key={message.id} className={message.role === 'user' ? 'flex justify-end' : ''}>
                {message.role === 'user' ? (
                  <p className="max-w-[85%] px-3 py-2 rounded-2xl rounded-br-md bg-[#1E1814] text-white text-sm whitespace-pre-line">
                    {message.content}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(message.content || message.status === 'streaming') && (
                      <p className="max-w-[95%] px-3 py-2 rounded-2xl rounded-bl-md bg-[#E9E2D6] text-sm text-[#1E1814] whitespace-pre-line">
                        {message.content}
                        {message.status === 'streaming' && (
                          <span aria-hidden="true" className="inline-block w-1.5 h-4 ml-0.5 align-text-bottom bg-[#8A4F33] animate-pulse" />
                        )}
                        {message.status === 'streaming' && <span className="sr-only">The assistant is writing…</span>}
                      </p>
                    )}
                    {message.status === 'error' && (
                      <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="flex-1">{message.error}</span>
                        {message.retryable && (
                          <button
                            type="button"
                            onClick={() => retry(message)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 font-semibold hover:underline cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Retry
                          </button>
                        )}
                      </div>
                    )}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <SuggestionCards
                        messageId={message.id}
                        suggestions={message.suggestions}
                        sample={Boolean(message.sample)}
                        applied={applied}
                        onApply={apply}
                      />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
          <div ref={threadEndRef} />
        </div>

        <form onSubmit={submit} className="border-t border-[#D8CDBC] p-3 flex items-end gap-2 shrink-0 bg-ivory">
          <label htmlFor="assistant-input" className="sr-only">
            Message the assistant
          </label>
          <textarea
            id="assistant-input"
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends; Shift+Enter makes a new line
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit(e);
              }
            }}
            placeholder={
              pendingAction
                ? 'Your idea in one line, e.g. a charity 5K at Karura on a Saturday morning'
                : 'Describe your idea, or ask for a change, e.g. "make it more formal"'
            }
            maxLength={2000}
            className="flex-1 resize-none px-3 py-2 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] placeholder-[#675A50]/60 focus:outline-none focus:border-[#8A4F33] focus:ring-1 focus:ring-[#8A4F33]"
          />
          <Button type="submit" variant="primary" size="sm" disabled={isBusy || !input.trim()} aria-label="Send">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
};

const SuggestionCards: React.FC<{
  messageId: number;
  suggestions: AssistantSuggestion[];
  sample: boolean;
  applied: Record<string, boolean>;
  onApply: (key: string, suggestion: AssistantSuggestion, mode?: ApplyMode) => void;
}> = ({ messageId, suggestions, sample, applied, onApply }) => {
  // Options for the same text field (e.g. five titles) are shown together as one list
  const groups: { field: AssistantSuggestion['field']; items: { suggestion: AssistantSuggestion; index: number }[] }[] = [];
  suggestions.forEach((suggestion, index) => {
    const group = groups.find((g) => g.field === suggestion.field);
    if (group) group.items.push({ suggestion, index });
    else groups.push({ field: suggestion.field, items: [{ suggestion, index }] });
  });

  const applyButton = (key: string, suggestion: AssistantSuggestion, label = 'Use this', mode: ApplyMode = 'replace') => (
    <Button
      type="button"
      size="sm"
      variant={applied[key] ? 'ghost' : 'outline'}
      onClick={() => onApply(key, suggestion, mode)}
      aria-label={`${label}: ${FIELD_NAMES[suggestion.field].toLowerCase()}${suggestion.label ? `, ${suggestion.label}` : ''}`}
      icon={applied[key] ? <Check className="w-3.5 h-3.5" /> : undefined}
    >
      {applied[key] ? 'Added' : label}
    </Button>
  );

  return (
    <div className="space-y-2">
      {groups.map(({ field, items }) => (
        <div key={field} className="rounded-2xl border border-[#D8CDBC] bg-[#F4EFE7] p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#675A50]">
              {FIELD_NAMES[field]}
              {items.length > 1 ? ` · ${items.length} options` : ''}
            </span>
            {sample && <span className="text-[10px] font-semibold text-[#8A4F33]">Sample</span>}
          </div>
          {items.map(({ suggestion, index }) => {
            const key = `${messageId}-${index}`;
            switch (suggestion.field) {
              case 'agenda':
                return (
                  <div key={key} className="space-y-2">
                    <ol className="text-xs text-[#1E1814] space-y-1">
                      {suggestion.value.map((item, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="tabular-nums font-semibold w-11 shrink-0">{item.time}</span>
                          <span>
                            {item.title}
                            {item.detail && <span className="block text-[#675A50]">{item.detail}</span>}
                          </span>
                        </li>
                      ))}
                    </ol>
                    <div className="flex flex-wrap gap-2">
                      {applyButton(`${key}-replace`, suggestion, 'Replace agenda', 'replace')}
                      {applyButton(`${key}-append`, suggestion, 'Append to agenda', 'append')}
                    </div>
                  </div>
                );
              case 'tiers':
                return (
                  <div key={key} className="space-y-2">
                    <ul className="text-xs text-[#1E1814] space-y-1.5">
                      {suggestion.value.map((tier, i) => (
                        <li key={i}>
                          <span className="font-semibold">{tier.name}</span> · {formatKES(tier.price)} · {tier.quantity} tickets
                          {tier.admits > 1 && ` · admits ${tier.admits}`}
                          {tier.description && <span className="block text-[#675A50]">{tier.description}</span>}
                          {tier.perks.length > 0 && <span className="block text-[#675A50]">Perks: {tier.perks.join(', ')}</span>}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-[#675A50]">Starting points: adjust prices and quantities to your event.</p>
                    <div className="flex flex-wrap gap-2">
                      {applyButton(`${key}-replace`, suggestion, 'Replace ticket types', 'replace')}
                      {applyButton(`${key}-append`, suggestion, 'Append ticket types', 'append')}
                    </div>
                  </div>
                );
              case 'tags':
                return (
                  <div key={key} className="flex flex-wrap items-center gap-1.5">
                    {suggestion.value.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-ivory border border-[#D8CDBC] text-[11px] text-[#1E1814]">
                        #{tag}
                      </span>
                    ))}
                    <span className="ml-auto">{applyButton(key, suggestion)}</span>
                  </div>
                );
              default:
                return (
                  <div key={key} className={`flex gap-2 ${items.length > 1 ? 'items-center' : 'flex-col'}`}>
                    <p className="flex-1 text-sm text-[#1E1814] whitespace-pre-line">
                      {suggestion.label && items.length > 1 && (
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#8A4F33]">{suggestion.label}</span>
                      )}
                      {suggestion.value}
                    </p>
                    <span className={items.length > 1 ? 'shrink-0' : 'self-end'}>{applyButton(key, suggestion)}</span>
                  </div>
                );
            }
          })}
        </div>
      ))}
    </div>
  );
};
