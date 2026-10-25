import { AxiosError, AxiosHeaders, AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';
import { getApiErrorCode, getApiErrorMessage, NETWORK_ERROR_MESSAGE, SERVER_ERROR_MESSAGE } from './api';

const httpError = (status: number, data: unknown) => {
  const config = { headers: new AxiosHeaders() };
  const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse;
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, {}, response);
};

describe('getApiErrorMessage: helpful, never technical', () => {
  it('shows one generic message for crashes and error pages, never their content', () => {
    expect(SERVER_ERROR_MESSAGE).toBe('Something went wrong on our side. Please try again in a moment.');
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

describe('server messages that say what to do next', () => {
  it('shows a written message from a temporarily unavailable service', () => {
    const msg = 'Google sign-in is not available right now. Please use your email and password.';
    expect(getApiErrorMessage(httpError(503, { error: msg }))).toBe(msg);
  });

  it('passes on the error code so the screen can offer the next step', () => {
    const notFound = httpError(404, { error: 'There is no MagiVents account for a@b.co yet. Sign up to create one.', code: 'account_not_found' });
    expect(getApiErrorCode(notFound)).toBe('account_not_found');
    expect(getApiErrorMessage(notFound)).toMatch(/Sign up/);
    expect(getApiErrorCode(httpError(400, { email: ['Enter a valid email address.'] }))).toBeNull();
    expect(getApiErrorCode(new Error('x'))).toBeNull();
  });
});
