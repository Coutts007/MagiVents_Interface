import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// api.ts reads tokens from localStorage; tests run in Node, so give it a minimal one
const store: Record<string, string> = { magivents_access_token: 'token-123' };
const stubStorage = () =>
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    }
  });
stubStorage();

const { assistantApi, AssistantRequestError, parseServerSentEvent } = await import('./api');

const sse = (events: [string, unknown][]) => events.map(([name, data]) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`).join('');

/** A streamed response delivered in awkward chunks, split mid-event */
function streamResponse(body: string, chunk = 7): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (let i = 0; i < body.length; i += chunk) controller.enqueue(encoder.encode(body.slice(i, i + chunk)));
      controller.close();
    }
  });
  return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

const request = { messages: [{ role: 'user' as const, content: 'A 5K at Karura' }], formState: { title: '' }, action: 'titles' as const };

describe('assistantApi.ask', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    stubStorage();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('streams the reply, then returns the suggestions', async () => {
    const done = { reply: 'Here are titles.', suggestions: [{ field: 'title', value: 'Karura 5K' }], provider: 'mock', sample: true };
    fetchMock.mockResolvedValue(
      streamResponse(
        sse([
          ['meta', { provider: 'mock', sample: true }],
          ['delta', { text: 'Here are ' }],
          ['reset', {}],
          ['delta', { text: 'Here are titles.' }],
          ['done', done]
        ])
      )
    );
    let text = '';
    const meta = vi.fn();
    const result = await assistantApi.ask(request, {
      onMeta: meta,
      onDelta: (piece) => (text += piece),
      onReset: () => (text = '')
    });
    expect(result).toEqual(done);
    expect(text).toBe('Here are titles.');
    expect(meta).toHaveBeenCalledWith({ provider: 'mock', sample: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/assistant\/event\/$/);
    expect(init.headers.Authorization).toBe('Bearer token-123');
    expect(JSON.parse(init.body)).toEqual(request);
  });

  it('turns an error event into a readable error', async () => {
    fetchMock.mockResolvedValue(
      streamResponse(sse([['meta', { provider: 'anthropic', sample: false }], ['error', { error: 'Busy', code: 'provider_rate_limited', retryable: true }]]))
    );
    await expect(assistantApi.ask(request)).rejects.toMatchObject({ message: 'Busy', code: 'provider_rate_limited', retryable: true });
  });

  it('explains the throttle and other refusals before the stream', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ detail: 'Request was throttled.' }), { status: 429 }));
    const throttled = await assistantApi.ask(request).catch((e) => e);
    expect(throttled).toBeInstanceOf(AssistantRequestError);
    expect(throttled.code).toBe('throttled');
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Bad key', code: 'provider_auth', retryable: false }), { status: 503 })
    );
    await expect(assistantApi.ask(request)).rejects.toMatchObject({ code: 'provider_auth', retryable: false });
  });

  it('reports a stream that ends without an answer', async () => {
    fetchMock.mockResolvedValue(streamResponse(sse([['meta', { provider: 'mock', sample: true }]])));
    await expect(assistantApi.ask(request)).rejects.toMatchObject({ code: 'incomplete' });
  });
});

describe('parseServerSentEvent', () => {
  it('reads named JSON events and ignores anything else', () => {
    expect(parseServerSentEvent('event: delta\ndata: {"text":"Hi"}')).toEqual({ name: 'delta', data: { text: 'Hi' } });
    expect(parseServerSentEvent(': keep-alive')).toBeNull();
    expect(parseServerSentEvent('event: delta\ndata: not json')).toBeNull();
  });
});
