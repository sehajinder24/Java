// Thin client for the Spring Boot backend. The backend only validates and serialises scenarios;
// it never stores them, so every call is stateless.

const BASE = import.meta.env.VITE_API_BASE || '/api';

export class ApiError extends Error {
  constructor(message, { errors = [], warnings = [], status = 0, offline = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.errors = errors;
    this.warnings = warnings;
    this.status = status;
    this.offline = offline;
  }
}

async function request(path, options) {
  let res;
  try {
    res = await fetch(BASE + path, options);
  } catch {
    throw new ApiError('The CommandMap backend is not reachable.', { offline: true });
  }
  if (res.ok) return res;

  let body = null;
  try {
    body = await res.json();
  } catch {
    // not JSON
  }
  // A dev-server proxy answers 5xx without a JSON body when nothing is listening on :8080.
  if (!body && res.status >= 500) {
    throw new ApiError('The CommandMap backend is not reachable.', { offline: true, status: res.status });
  }
  throw new ApiError(body?.message || `Request failed (${res.status})`, {
    errors: body?.errors ?? [],
    warnings: body?.warnings ?? [],
    status: res.status,
  });
}

const jsonPost = (body) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

export async function checkHealth() {
  try {
    const res = await request('/health');
    const data = await res.json();
    return data.status === 'UP';
  } catch {
    return false;
  }
}

/** Always resolves with {valid, errors, warnings} when the backend answers. */
export async function validateScenario(scenario) {
  const res = await request('/scenarios/validate', jsonPost(scenario));
  return res.json();
}

/** Asks the backend to validate the scenario and generate the JSON file. */
export async function exportScenario(scenario) {
  const res = await request('/scenarios/export', jsonPost(scenario));
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  return {
    blob: await res.blob(),
    filename: match ? decodeURIComponent(match[1]) : 'scenario.commandmap.json',
  };
}

/** Sends the raw text of a scenario file to the backend, which validates and normalises it. */
export async function importScenario(fileText) {
  const res = await request('/scenarios/import', jsonPost(fileText));
  const body = await res.json();
  return { scenario: body.data, warnings: body.warnings ?? [] };
}
