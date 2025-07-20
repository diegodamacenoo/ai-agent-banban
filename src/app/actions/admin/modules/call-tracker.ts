// Utilitário para rastrear chamadas de server actions
let callCounter = 0;

export function trackServerCall(actionName: string, details?: any) {
  callCounter++;
  const timestamp = new Date().toISOString();
  console.log(`📞 CALL #${callCounter} [${timestamp}] ${actionName}`, details ? details : '');
  return callCounter;
}

export function getCallCount() {
  return callCounter;
}

export function resetCallCount() {
  callCounter = 0;
}