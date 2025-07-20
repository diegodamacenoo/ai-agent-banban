import { NextRequest } from 'next/server';
import { handlePurchaseFlowPOST, handlePurchaseFlowGET } from './handlers/purchase-handler';

export { PurchaseFlowService } from './services/PurchaseFlowService';
export { handlePurchaseFlowPOST, handlePurchaseFlowGET } from './handlers/purchase-handler';

// Main module handler that routes to appropriate method handlers
export async function handlePurchaseFlow(req: NextRequest) {
  switch (req.method) {
    case 'POST':
      return handlePurchaseFlowPOST(req);
    case 'GET':
      return handlePurchaseFlowGET(req);
    default:
      return new Response(`Method ${req.method} not allowed`, { status: 405 });
  }
}