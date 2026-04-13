import axios from 'axios';

export interface ApiEnvelope<T> {
  data: T;
}

const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3333/api';
const useMockApi = process.env.REACT_APP_USE_MOCK_API !== 'false';

export const apiClient = axios.create({
  baseURL,
  timeout: 8000,
});

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const unwrap = <T>(raw: ApiEnvelope<T> | T): T => {
  if (typeof raw === 'object' && raw !== null && 'data' in raw) {
    return (raw as ApiEnvelope<T>).data;
  }

  return raw as T;
};

export const getWithFallback = async <T>(
  path: string,
  mockFactory: () => T,
  mockDelayMs = 200,
): Promise<T> => {
  if (useMockApi) {
    await delay(mockDelayMs);
    return mockFactory();
  }

  try {
    const response = await apiClient.get<ApiEnvelope<T> | T>(path);
    return unwrap(response.data);
  } catch (error) {
    await delay(mockDelayMs);
    return mockFactory();
  }
};

export const postWithFallback = async <TResponse, TBody>(
  path: string,
  body: TBody,
  mockFactory: () => TResponse,
  mockDelayMs = 200,
): Promise<TResponse> => {
  if (useMockApi) {
    await delay(mockDelayMs);
    return mockFactory();
  }

  try {
    const response = await apiClient.post<ApiEnvelope<TResponse> | TResponse>(path, body);
    return unwrap(response.data);
  } catch (error) {
    await delay(mockDelayMs);
    return mockFactory();
  }
};

export const patchWithFallback = async <TResponse, TBody>(
  path: string,
  body: TBody,
  mockFactory: () => TResponse,
  mockDelayMs = 160,
): Promise<TResponse> => {
  if (useMockApi) {
    await delay(mockDelayMs);
    return mockFactory();
  }

  try {
    const response = await apiClient.patch<ApiEnvelope<TResponse> | TResponse>(path, body);
    return unwrap(response.data);
  } catch (error) {
    await delay(mockDelayMs);
    return mockFactory();
  }
};
