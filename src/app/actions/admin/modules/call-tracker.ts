// Utilitário para rastrear chamadas de server actions
import { conditionalDebugLog } from './system-config-utils';

let callCounter = 0;

export async function trackServerCall(actionName: string, details?: any) {
  // Só fazer tracking em desenvolvimento para evitar overhead
  if (process.env.NODE_ENV === 'development') {
    callCounter++;
    const timestamp = new Date().toISOString();
    console.debug(`CALL #${callCounter} [${timestamp}] ${actionName}`);
  }
  return callCounter;
}

export function getCallCount() {
  return callCounter;
}

export function resetCallCount() {
  callCounter = 0;
}