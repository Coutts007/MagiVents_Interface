import { AxiosError, AxiosHeaders, AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';
import { getApiErrorMessage, NETWORK_ERROR_MESSAGE, SERVER_ERROR_MESSAGE } from './api';

const httpError = (status: number, data: unknown) => {
  const config = { headers: new AxiosHeaders() };
  const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse;
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, {}, response);
};

describe('getApiErrorMessage keeps messages short', () => {
  it('says only "Server error." for crashes and error pages', () => {
    expect(getApiErrorMessage(httpError(500, { error: 'Server error.' }))).toBe(SERVER_ERROR_MESSAGE);
    expect(getApiErrorMessage(httpError(500, '<html><h1>Traceback (most recent call last)…</h1></html>'))).toBe(SERVER_ERROR_MESSAGE);
    expect(getApiErrorMessage(httpError(502, '<html>Bad Gateway nginx/1.27</html>'))).toBe(SERVER_ERROR_MESSAGE);
  });

  it('gives a plain network message when the server cannot be reached', () => {
    const offline = new AxiosError('Network Error', 'ERR_NETWORK', { headers: new AxiosHeaders() });
    expect(getApiErrorMessage(offline)).toBe(NETWORK_ERROR_MESSAGE);
    expect(NETWORK_ERROR_MESSAGE).not.toMatch(/backend/i);
  });

  it('still shows what the user can fix in a form', () => {
    expect(getApiErrorMessage(httpError(400, { phoneNumber: ['Enter a valid M-Pesa number, e.g. 0712 345 678.'] }))).toBe(
      'Enter a valid M-Pesa number, e.g. 0712 345 678.'
    );
    expect(getApiErrorMessage(httpError(401, { error: 'Incorrect email or password.' }))).toBe('Incorrect email or password.');
  });

  it('never shows a JavaScript error', () => {
    expect(getApiErrorMessage(new TypeError("Cannot read properties of undefined (reading 'id')"), 'Could not save.')).toBe(
      'Could not save.'
    );
    expect(getApiErrorMessage(new Error('Please enter a valid email address.'))).toBe('Please enter a valid email address.');
  });
});
