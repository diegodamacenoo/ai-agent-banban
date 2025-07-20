import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateAndGetTenant, createBusinessTransaction, upsertBusinessEntity, createBusinessRelationship, getECAEntityByExternalId, upsertECABusinessEntity } from '../../../../shared/webhook-base/index';
import {
  TRANSFER_ACTIONS,
  TransferAction,
  BANBAN_ORG_ID,
  EntityType
} from '@shared/enums';
import {
  WebhookPayloadData,
  QueryTransfersParams,
  AnalyticsParams,
  TransferProcessResult,
  TransferQueryResult,
  TransferAnalyticsResult,
  RoutePerformance,
  DemandPatterns,
  BusinessTransaction,
  BusinessEntity,
  TransferDiscrepancy,
  TransferItem,
  CriticalProduct,
  RouteStats,
  DailyVolumeStats
} from '../types/transfer-types';

/**
 * Orquestra os fluxos de trabalho de Transferência, com foco em analytics.
 * Implementa a lógica de Eventos, Transações e Snapshots de Performance.
 */
export class BanBanTransferFlowService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });
  }

  /**
   * Ponto de entrada principal para processar todas as ações de transferência.
   */
  async processAction(action: keyof typeof TRANSFER_ACTIONS, transactionData: WebhookPayloadData, metadata?: Record<string, unknown>): Promise<TransferProcessResult> {
    await validateAndGetTenant(BANBAN_ORG_ID);

    switch (action) {
      case TRANSFER_ACTIONS.CREATE_TRANSFER_REQUEST as TransferAction:
        return this._createTransferRequest(transactionData, metadata);
      case TRANSFER_ACTIONS.REGISTER_REQUEST as TransferAction:
        return this._registerRequest(transactionData, metadata);
      case TRANSFER_ACTIONS.CREATE_SEPARATION_MAP as TransferAction:
        return this._createSeparationMap(transactionData, metadata);
      case TRANSFER_ACTIONS.START_SEPARATION as TransferAction:
        return this._startSeparation(transactionData, metadata);
      case TRANSFER_ACTIONS.COMPLETE_SEPARATION as TransferAction:
        return this._completeSeparation(transactionData, metadata);
      case TRANSFER_ACTIONS.SHIP_TRANSFER as TransferAction:
        return this._registerShipment(transactionData, metadata);
      case TRANSFER_ACTIONS.INVOICE_TRANSFER as TransferAction:
        return this._invoiceTransfer(transactionData, metadata);
      case TRANSFER_ACTIONS.START_STORE_CONFERENCE as TransferAction:
        return this._startStoreConference(transactionData, metadata);
      case TRANSFER_ACTIONS.SCAN_STORE_ITEMS as TransferAction:
        return this._scanStoreItems(transactionData, metadata);
      case TRANSFER_ACTIONS.COMPLETE_STORE_CONFERENCE as TransferAction:
        return this._completeStoreConference(transactionData, metadata);
      case TRANSFER_ACTIONS.EFFECTUATE_STORE as TransferAction:
        return this._effectuateStore(transactionData, metadata);
      case TRANSFER_ACTIONS.REGISTER_RECEIPT as TransferAction:
        return this._registerReceipt(transactionData, metadata);
      case TRANSFER_ACTIONS.REGISTER_COMPLETION as TransferAction:
        return this._registerCompletion(transactionData, metadata);
      default:
        throw new Error(`Ação de transferência desconhecida: ${action}`);
    }
  }

  /**
   * Lida com a consulta de dados de transferência, incluindo analytics.
   */
  async getTransferData(queryParams: QueryTransfersParams): Promise<TransferQueryResult | RoutePerformance | DemandPatterns> {
    const { limit = 50, offset = 0, external_id, status, transaction_type, date_from, date_to, origin_location_external_id, destination_location_external_id, route_analysis, demand_analysis } = queryParams;

    if (route_analysis && origin_location_external_id && destination_location_external_id) {
        return this._calculateRoutePerformance(origin_location_external_id, destination_location_external_id);
    }

    if (demand_analysis && destination_location_external_id) {
        return this._calculateDemandAnalysis({ 
          org: 'banban',
          location_id: destination_location_external_id, 
          from_date: date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), 
          to_date: date_to || new Date().toISOString()
        });
    }
    let query = this.supabase
      .from('tenant_business_transactions')
      .select('*')
      .eq('organization_id', BANBAN_ORG_ID)
      .in('transaction_type', ['TRANSFER_OUT', 'TRANSFER_IN']); // Filtrar apenas Transfer Flow

    if (external_id) query = query.eq('external_id', external_id);
    if (status) query = query.eq('status', status);
    if (transaction_type) query = query.eq('transaction_type', transaction_type);
    if (origin_location_external_id) query = query.contains('attributes', { origin_location_external_id: origin_location_external_id });
    if (destination_location_external_id) query = query.contains('attributes', { destination_location_external_id: destination_location_external_id });
    if (date_from) query = query.gte('created_at', date_from);
    if (date_to) query = query.lte('created_at', date_to);

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
        console.error('❌ [TransferService-ECA] Erro ao buscar transações:', error);
        throw new Error(`Erro ao buscar transferências: ${error.message}`);
    }
    
    return {
      success: true,
      data: {
        transfers: data || [],
        total: data?.length || 0,
        limit,
        offset
      },
      metadata: {
        query_executed_at: new Date().toISOString(),
        organization_id: BANBAN_ORG_ID,
        filters_applied: {
          external_id: external_id,
          status: status,
          transaction_type: transaction_type,
          origin_location_external_id: origin_location_external_id,
          destination_location_external_id: destination_location_external_id,
          date_from: date_from,
          date_to: date_to
        }
      }
    };
  }

  /**
   * Busca analytics do Transfer Flow usando dados ECA
   */
  async getTransferAnalytics(queryParams: AnalyticsParams): Promise<TransferAnalyticsResult> {
    const { from_date, to_date, origin_location_external_id, destination_location_external_id } = queryParams;
    
    let query = this.supabase
      .from('tenant_business_transactions')
      .select('status, attributes, created_at, transaction_type')
      .eq('organization_id', BANBAN_ORG_ID)
      .in('transaction_type', ['TRANSFER_OUT', 'TRANSFER_IN']);
      
    if (from_date) query = query.gte('created_at', from_date);
    if (to_date) query = query.lte('created_at', to_date);
    if (origin_location_external_id) query = query.contains('attributes', { origin_location_external_id: origin_location_external_id });
    if (destination_location_external_id) query = query.contains('attributes', { destination_location_external_id: destination_location_external_id });
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Erro ao buscar analytics: ${error.message}`);
    }
    
    // Calcular métricas
    const statusDistribution = data.reduce((acc: Record<string, number>, item: any) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
    
    const totalTransfers = data.length;
    const transferOutCount = data.filter((item: any) => item.transaction_type === 'TRANSFER_OUT').length;
    const transferInCount = data.filter((item: any) => item.transaction_type === 'TRANSFER_IN').length;
    const avgProcessingTime = this._calculateAvgTransferTime(data);
    
    return {
      success: true,
      data: {
        summary: {
          total_transfers: totalTransfers,
          transfer_out_count: transferOutCount,
          transfer_in_count: transferInCount,
          status_distribution: statusDistribution,
          avg_processing_time_hours: avgProcessingTime,
          period_from: from_date,
          period_to: to_date
        },
        route_analytics: {
          top_routes: this._calculateTopRoutes(data)
        },
        trends: {
          daily_volume: this._calculateDailyTransferVolume(data)
        }
      },
      metadata: {
        generated_at: new Date().toISOString(),
        organization_id: BANBAN_ORG_ID
      }
    };
  }
  
  private _calculateAvgTransferTime(data: any[]): number {
    if (!data.length) return 0;
    
    const withStateHistory = data.filter(item => 
      item.attributes?.state_history && item.attributes.state_history.length > 0
    );
    
    if (!withStateHistory.length) return 0;
    
    const totalHours = withStateHistory.reduce((sum, item) => {
      const history = item.attributes.state_history;
      const firstTransition = new Date(item.created_at);
      const lastTransition = new Date(history[history.length - 1].transitioned_at);
      const hours = (lastTransition.getTime() - firstTransition.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);
    
    return totalHours / withStateHistory.length;
  }
  
  private _calculateTopRoutes(data: any[]): RouteStats[] {
    const routeCount = data.reduce((acc: Record<string, number>, item) => {
      const origin = item.attributes?.origin_location_external_id;
      const destination = item.attributes?.destination_location_external_id;
      if (origin && destination) {
        const route = `${origin}->${destination}`;
        acc[route] = (acc[route] || 0) + 1;
      }
      return acc;
    }, {});
    
    return Object.entries(routeCount)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
  
  private _calculateDailyTransferVolume(data: any[]): DailyVolumeStats[] {
    const dailyCount = data.reduce((acc: Record<string, number>, item) => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(dailyCount).map(([date, count]) => ({ date, count }));
  }
  
  private async _calculateDemandAnalysis(params: AnalyticsParams): Promise<DemandPatterns> {
    // TODO: Implementar análise de demanda usando dados ECA
    return {
      location: params.location_id || 'unknown',
      total_transfers_received: 0,
      avg_monthly_transfers: '0.0',
      critical_products: [],
      last_updated: new Date().toISOString()
    };
  }

  // ================================================
  // MÉTODOS LEGACY (mantidos para compatibilidade)
  // ================================================
  // Todos os métodos privados abaixo são mantidos apenas para compatibilidade.
  // Para novos desenvolvimentos, use a arquitetura ECA via processECAWebhook()
  
  // --- MÉTODOS DE IMPLEMENTAÇÃO PRIVADOS LEGACY ---

  private async _createTransferRequest(data: WebhookPayloadData, metadata?: Record<string, unknown>): Promise<TransferProcessResult> {
    if (!data || !data.external_id || !data.items || !data.origin_location_external_id || !data.destination_location_external_id) {
      throw new Error('external_id, items, e localizações de origem/destino são obrigatórios.');
    }

    // 1. Criar ou obter a entidade da localização de origem
    const originLocationEntity = await this._getOrCreateBusinessEntity(
      BANBAN_ORG_ID,
      'LOCATION' as EntityType,
      data.origin_location_external_id,
      { name: data.origin_location_name || `Local ${data.origin_location_external_id}` }
    );

    // 2. Criar ou obter a entidade da localização de destino
    const destinationLocationEntity = await this._getOrCreateBusinessEntity(
      BANBAN_ORG_ID,
      'LOCATION' as EntityType,
      data.destination_location_external_id,
      { name: data.destination_location_name || `Local ${data.destination_location_external_id}` }
    );

    // 3. Criar a transação de pedido de transferência com status PEDIDO_TRANSFERENCIA_CRIADO
    const transaction = await createBusinessTransaction(
      BANBAN_ORG_ID,
      'TRANSFER_OUT',
      data.external_id,
      { ...(data || {}), status: 'PEDIDO_TRANSFERENCIA_CRIADO' }
    );

    // 4. Registrar relacionamento: Pedido de Transferência -> Local de Origem
    await createBusinessRelationship(
      BANBAN_ORG_ID,
      'ORIGINATES_FROM',
      transaction.id,
      originLocationEntity.id,
      {}
    );

    // 5. Registrar relacionamento: Pedido de Transferência -> Local de Destino
    await createBusinessRelationship(
      BANBAN_ORG_ID,
      'DESTINED_TO',
      transaction.id,
      destinationLocationEntity.id,
      {}
    );

    // 6. Registrar relacionamentos: Pedido de Transferência -> Produtos
    for (const item of data.items) {
      const productEntity = await this._getOrCreateBusinessEntity(
        BANBAN_ORG_ID,
        'PRODUCT',
        item.product_external_id,
        { name: item.product_name || `Produto ${item.product_external_id}` }
      );

      await createBusinessRelationship(
        BANBAN_ORG_ID,
        'CONTAINS_ITEM',
        transaction.id,
        productEntity.id,
        { quantity: item.quantity, unit_cost: item.unit_cost }
      );
    }

    await this._createBusinessEvent('TRANSACTION', transaction.id, 'transfer_request_created', { ...data, ...metadata });

    return {
      transaction_id: transaction.id,
      external_id: data.external_id,
      status: 'PEDIDO_TRANSFERENCIA_CRIADO',
      success: true,
      entityType: 'TRANSFER_REQUEST', // Assuming a new entity type for transfer request
      entityId: transaction.id,
      summary: {
        message: 'Transfer request created successfully',
        records_processed: 1,
        records_successful: 1,
        records_failed: 0
      }
    };
  }

  private async _registerRequest(data: WebhookPayloadData, metadata?: Record<string, unknown>): Promise<TransferProcessResult> {
    if (!data.external_id || !data.items || !data.origin_location_external_id || !data.destination_location_external_id) {
      throw new Error('external_id, items, e localizações de origem/destino são obrigatórios.');
    }

    // 1. Criar ou obter a entidade da localização de origem
    const originLocationEntity = await this._getOrCreateBusinessEntity(
      BANBAN_ORG_ID,
      'LOCATION' as EntityType,
      data.origin_location_external_id,
      { name: data.origin_location_name || `Local ${data.origin_location_external_id}` }
    );

    // 2. Criar ou obter a entidade da localização de destino
    const destinationLocationEntity = await this._getOrCreateBusinessEntity(
      BANBAN_ORG_ID,
      'LOCATION' as EntityType,
      data.destination_location_external_id,
      { name: data.destination_location_name || `Local ${data.destination_location_external_id}` }
    );

    // 3. Criar a transação de pedido de transferência com status PEDIDO_TRANSFERENCIA_CRIADO
    const transaction = await createBusinessTransaction(
      BANBAN_ORG_ID,
      'TRANSFER_OUT',
      data.external_id,
      { ...data, status: 'PEDIDO_TRANSFERENCIA_CRIADO' }
    );

    // 4. Registrar relacionamento: Pedido de Transferência -> Local de Origem
    await createBusinessRelationship(
      BANBAN_ORG_ID,
      'ORIGINATES_FROM',
      transaction.id,
      originLocationEntity.id,
      {}
    );

    // 5. Registrar relacionamento: Pedido de Transferência -> Local de Destino
    await createBusinessRelationship(
      BANBAN_ORG_ID,
      'DESTINED_TO',
      transaction.id,
      destinationLocationEntity.id,
      {}
    );

    // 6. Registrar relacionamentos: Pedido de Transferência -> Produtos
    for (const item of data.items) {
      const productEntity = await this._getOrCreateBusinessEntity(
        BANBAN_ORG_ID,
        'PRODUCT',
        item.product_external_id,
        { name: item.product_name || `Produto ${item.product_external_id}` }
      );

      await createBusinessRelationship(
        BANBAN_ORG_ID,
        'CONTAINS_ITEM',
        transaction.id,
        productEntity.id,
        { quantity: item.quantity, unit_cost: item.unit_cost }
      );
    }

    await this._createBusinessEvent('TRANSACTION', transaction.id, 'transfer_request_registered', { ...data, ...metadata });

    return {
      transaction_id: transaction.id,
      external_id: data.external_id,
      status: 'PEDIDO_TRANSFERENCIA_CRIADO',
      success: true,
      entityType: 'TRANSFER_REQUEST', // Assuming a new entity type for transfer request
      entityId: transaction.id,
      summary: {
        message: 'Transfer request created successfully',
        records_processed: 1,
        records_successful: 1,
        records_failed: 0
      }
    };
  }

  private async _createSeparationMap(data: any, metadata?: any) {
    const transferExternalId = data.transfer_external_id || data.external_id;
    const transaction = await this._getTransactionByExternalId(transferExternalId, 'TRANSFER_OUT');

    // Validar que o status atual é PEDIDO_TRANSFERENCIA_CRIADO
    if (transaction.status !== 'PEDIDO_TRANSFERENCIA_CRIADO') {
      throw new Error(`Transferência ${transferExternalId} não pode criar mapa de separação pois seu status é ${transaction.status}. Esperado: PEDIDO_TRANSFERENCIA_CRIADO.`);
    }

    const newStatus = 'AGUARDANDO_SEPARACAO_CD';
    const newAttributes = {
      ...transaction.attributes,
      status: newStatus,
      mapa_separacao_id: data.mapa_separacao_id || crypto.randomUUID(),
      criado_em: new Date().toISOString(),
    };

    // Atualizar o status, os atributos e o timestamp em uma única operação
    const { data: updatedTx, error } = await this.supabase
      .from('tenant_business_transactions')
      .update({
        status: newStatus,
        attributes: newAttributes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id)
      .select()
      .single();

    if (error) {
      console.error(`[BanBanTransferFlowService] Erro ao atualizar transação para ${newStatus}:`, error);
      throw error;
    }

    await this._createBusinessEvent('TRANSACTION', transaction.id, 'transfer_separation_map_created', { ...data, ...metadata });
    await this._createBusinessEvent('TRANSACTION', transaction.id, 'transfer_awaiting_separation', { ...data, ...metadata });

    return {
      transaction_id: transaction.id,
      external_id: transaction.external_id,
      status: newStatus,
      success: true,
      entityType: 'TRANSFER_SEPARATION_MAP',
      entityId: transaction.id,
      summary: {
        message: 'Separation map created and status updated to AGUARDANDO_SEPARACAO_CD',
        records_processed: 1,
        records_successful: 1,
        records_failed: 0,
      },
    };
  }

  private async _startSeparation(data: any, metadata?: any) {
    const transferExternalId = data.transfer_external_id || data.external_id;
    const transaction = await this._getTransactionByExternalId(transferExternalId, 'TRANSFER_OUT');

    // Validar que o status atual é MAPA_SEPARACAO_CRIADO ou AGUARDANDO_SEPARACAO_CD
    if (transaction.status !== 'MAPA_SEPARACAO_CRIADO' && 
        transaction.status !== 'AGUARDANDO_SEPARACAO_CD') {
      throw new Error(`Transferência ${transferExternalId} não pode iniciar separação pois seu status é ${transaction.status}. Esperado: MAPA_SEPARACAO_CRIADO ou AGUARDANDO_SEPARACAO_CD.`);
    }

    // Atualizar o status para EM_SEPARACAO_CD
    const { data: updatedTx, error } = await this.supabase.from('tenant_business_transactions')
      .update({ 
        status: 'EM_SEPARACAO_CD',
        attributes: { ...transaction.attributes, status: 'EM_SEPARACAO_CD', separacao_iniciada_em: new Date().toISOString(), operador_id: data.operador_id } 
      })
      .eq('id', transaction.id)
      .select()
      .single();
    if(error) throw error;

    await this._createBusinessEvent('TRANSACTION', transaction.id, 'transfer_separation_started', { ...data, ...metadata });
    
    return {
      transaction_id: transaction.id,
      external_id: transaction.external_id,
      status: 'EM_SEPARACAO_CD',
      success: true,
      entityType: 'TRANSFER_SEPARATION',
      entityId: transaction.id,
      summary: {
        message: 'Separation started successfully',
        records_processed: 1,
        records_successful: 1,
        records_failed: 0
      }
    };
  }

  private async _completeSeparation(data: any, metadata?: any) {
    const transferExternalId = data.transfer_external_id || data.external_id;
    if (!transferExternalId || !data.items) throw new Error('transfer_external_id e items são obrigatórios.');
    const transaction = await this._getTransactionByExternalId(transferExternalId, 'TRANSFER_OUT');

    // Validar que o status atual é EM_SEPARACAO_CD
    if (transaction.status !== 'EM_SEPARACAO_CD') {
      throw new Error(`Transferência ${transferExternalId} não está em separação. Status atual: ${transaction.status}.`);
    }

    // Determinar o status final da separação e coletar divergências
    let hasDiscrepancy = false;
    const discrepancies: TransferDiscrepancy[] = [];
    for (const item of data.items) {
      if (item.qty_diff && item.qty_diff !== 0) {
        hasDiscrepancy = true;
        discrepancies.push({ sku: item.product_id, qty_solicitada: item.qty_solicitada, qty_separada: item.qty_separada, qty_diff: item.qty_diff });
      }
    }

    const newStatus = hasDiscrepancy ? 'SEPARACAO_CD_COM_DIVERGENCIA' : 'SEPARACAO_CD_SEM_DIVERGENCIA';

    // Atualizar o status da transferência
    const { data: updatedTx, error } = await this.supabase.from('tenant_business_transactions')
      .update({ 
        status: newStatus,
        attributes: { ...transaction.attributes, status: newStatus, separacao_finalizada_em: new Date().toISOString(), divergencias: discrepancies } 
      })
      .eq('id', transaction.id)
      .select()
      .single();
    if(error) throw error;

    await this._createBusinessEvent('TRANSACTION', transaction.id, 'transfer_separation_completed', { ...data, ...metadata });

    // Automaticamente transicionar para SEPARADO_PRE_DOCA após completar a separação
    const { data: updatedTx2, error: error2 } = await this.supabase.from('tenant_business_transactions')
      .update({ 
        status: 'SEPARADO_PRE_DOCA',
        attributes: { ...updatedTx.attributes, status: 'SEPARADO_PRE_DOCA', pre_doca_em: new Date().toISOString() } 
      })
      .eq('id', transaction.id)
      .select()
      .single();
    if(error2) throw error2;

    await this._createBusinessEvent('TRANSACTION', transaction.id, 'transfer_pre_dock', { ...data, ...metadata });

    return {
      transaction_id: transaction.id,
      external_id: transaction.external_id,
      status: 'SEPARADO_PRE_DOCA',
      success: true,
      entityType: 'TRANSFER_SEPARATION',
      entityId: transaction.id,
      summary: {
        message: `Separation completed with status: ${newStatus}`,
        records_processed: 1,
        records_successful: 1,
        records_failed: 0
      }
    };
  }

  private async _registerShipment(data: any, metadata?: any) {
    const transferExternalId = data.transfer_external_id || data.external_id;
    if (!transferExternalId || !data.items_shipped) throw new Error('transfer_external_id e items_shipped são obrigatórios.');
    const transaction = await this._getTransactionByExternalId(transferExternalId, 'TRANSFER_OUT');

    // Validar que o status atual é SEPARADO_PRE_DOCA ou similar
    if (transaction.status !== 'SEPARADO_PRE_DOCA' && 
        transaction.status !== 'SEPARACAO_CD_SEM_DIVERGENCIA' && 
        transaction.status !== 'SEPARACAO_CD_COM_DIVERGENCIA') {
      throw new Error(`Transferência ${transferExternalId} não pode ser embarcada pois seu status é ${transaction.status}. Esperado: SEPARADO_PRE_DOCA ou similar.`);
    }

    // Primeiro, atualizar o status para EMBARCADO_CD
    const { data: updatedTx, error } = await this.supabase.from('tenant_business_transactions')
      .update({ 
        status: 'EMBARCADO_CD',
        attributes: { ...transaction.attributes, status: 'EMBARCADO_CD', embarcado_em: new Date().toISOString(), veiculo_id: data.veiculo_id } 
      })
      .eq('id', transaction.id)
      .select()
      .single();
    if(error) throw error;

    await this._createBusinessEvent('TRANSACTION', transaction.id, 'transfer_shipped', { ...data, ...metadata });

    // Criar movimentação de estoque de saída do CD
    const originLocationEntity = await this._getOrCreateBusinessEntity(
      BANBAN_ORG_ID,
      'LOCATION' as EntityType,
      transaction.attributes.origin_location_external_id,
      { name: transaction.attributes.origin_location_name }
    );

    for (const item of data.items_shipped) {
      const productEntity = await this._getOrCreateBusinessEntity(
        BANBAN_ORG_ID,
        'PRODUCT',
        item.variant_external_id,
        { name: item.product_name || `Produto ${item.variant_external_id}` }
      );

      const inventoryMovement = await createBusinessTransaction(
        BANBAN_ORG_ID,
        'INVENTORY_MOVEMENT',
        null, // external_id pode ser nulo para movimentos internos
        {
          qty_change: -item.qty_shipped, // Quantidade negativa para saída
          movement_type: 'TRANSFER_OUT',
          reference_transfer_id: transaction.id,
          reference_transfer_external_id: transaction.external_id,
          product_external_id: item.variant_external_id,
          location_external_id: transaction.attributes.origin_location_external_id,
          status: 'MOVIMENTO_EXECUTADO', // Estado válido para INVENTORY_MOVEMENT
          ...item
        }
      );

      await createBusinessRelationship(
        BANBAN_ORG_ID,
        'AFFECTS_PRODUCT',
        inventoryMovement.id,
        productEntity.id,
        {}
      );
      await createBusinessRelationship(
        BANBAN_ORG_ID,
        'AT_LOCATION',
        inventoryMovement.id,
        originLocationEntity.id,
        {}
      );
      await createBusinessRelationship(
        BANBAN_ORG_ID,
        'CAUSED_BY_TRANSFER',
        inventoryMovement.id,
        transaction.id,
        {}
      );

      await this._updateInventorySnapshot(
        item.variant_external_id,
        transaction.attributes.origin_location_external_id,
        -item.qty_shipped,
        'TRANSFER_OUT',
        inventoryMovement.id
      );
    }

    return {
      transaction_id: transaction.id,
      external_id: transaction.external_id,
      status: 'EMBARCADO_CD',
      success: true,
      entityType: 'TRANSFER_SHIPMENT',
      entityId: transaction.id,
      summary: {
        message: 'Transfer shipment registered successfully',
        records_processed: 1,
        records_successful: 1,
        records_failed: 0
      }
    };
  }

  private async _invoiceTransfer(data: any, metadata?: any) {
    const transferExternalId = data.transfer_external_id || data.external_id;
    if (!transferExternalId || !data.invoice_external_id) throw new Error('transfer_external_id e invoice_external_id são obrigatórios.');
    const transaction = await this._getTransactionByExternalId(transferExternalId, 'TRANSFER_OUT');

    // Validar que o status atual é EMBARCADO_CD
    if (transaction.status !== 'EMBARCADO_CD') {
      throw new Error(`Transferência ${transferExternalId} não pode ser faturada pois seu status é ${transaction.status}. Esperado: EMBARCADO_CD.`);
    }

    // Atualizar o status para TRANSFERENCIA_CDH_FATURADA
    const { data: updatedTx, error } = await this.supabase.from('tenant_business_transactions')
      .update({ 
        status: 'TRANSFERENCIA_CDH_FATURADA',
        attributes: { ...transaction.attributes, status: 'TRANSFERENCIA_CDH_FATURADA', faturado_em: new Date().toISOString(), invoice_external_id: data.invoice_external_id } 
      })
      .eq('id', transaction.id)
      .select()
      .single();
    if(error) throw error;

    // Criar o documento TRANSFER_IN correspondente para controlar o recebimento na loja
    const transferInDocument = await createBusinessTransaction(
      BANBAN_ORG_ID,
      'TRANSFER_IN',
      data.invoice_external_id,
      { ...data, status: 'AGUARDANDO_CONFERENCIA_LOJA', reference_transfer_id: transaction.id }
    );

    // Registrar relacionamento: TRANSFER_IN baseado no TRANSFER_OUT
    await createBusinessRelationship(
      BANBAN_ORG_ID,
      'BASED_ON_ORDER',
      transferInDocument.id,
      transaction.id,
      {}
    );

    await this._createBusinessEvent('TRANSACTION', transaction.id, 'transfer_invoiced', { ...data, ...metadata });

    return { 
      transaction_id: transaction.id, 
      external_id: transaction.external_id, 
      status: 'TRANSFERENCIA_CDH_FATURADA',
      transfer_in_document_id: transferInDocument.id,
      success: true,
      entityType: 'TRANSFER_INVOICE',
      entityId: transaction.id,
      summary: {
        message: 'Transfer invoiced successfully',
        records_processed: 1,
        records_successful: 1,
        records_failed: 0
      }
    };
  }

  private async _startStoreConference(data: any, metadata?: any) {
    if (!data.invoice_external_id) throw new Error('invoice_external_id é obrigatório.');
    const transaction = await this._getTransactionByExternalId(data.invoice_external_id, 'TRANSFER_IN');

    // Validar que o status atual é AGUARDANDO_CONFERENCIA_LOJA
    if (transaction.status !== 'AGUARDANDO_CONFERENCIA_LOJA') {
      throw new Error(`Documento ${data.invoice_external_id} não pode iniciar conferência pois seu status é ${transaction.status}. Esperado: AGUARDANDO_CONFERENCIA_LOJA.`);
    }

    // Atualizar o status para EM_CONFERENCIA_LOJA
    const { data: updatedTx, error } = await this.supabase.from('tenant_business_transactions')
      .update({ 
        status: 'EM_CONFERENCIA_LOJA',
        attributes: { ...transaction.attributes, status: 'EM_CONFERENCIA_LOJA', conferencia_loja_iniciada_em: new Date().toISOString() } 
      })
      .eq('id', transaction.id)
      .select()
      .single();
    if(error) throw error;

    await this._createBusinessEvent('TRANSACTION', transaction.id, 'store_conference_started', { ...data, ...metadata });

    return {
      transaction_id: transaction.id,
      external_id: transaction.external_id,
      status: 'EM_CONFERENCIA_LOJA',
      success: true,
      entityType: 'STORE_CONFERENCE',
      entityId: transaction.id,
      summary: {
        message: 'Store conference started successfully',
        records_processed: 1,
        records_successful: 1,
        records_failed: 0
      }
    };
  }

  private async _scanStoreItems(data: any, metadata?: any) {
    if (!data.invoice_external_id || !data.items) throw new Error('invoice_external_id e items são obrigatórios.');
    const transaction = await this._getTransactionByExternalId(data.invoice_external_id, 'TRANSFER_IN');

    // Validar que o status atual é EM_CONFERENCIA_LOJA
    if (transaction.status !== 'EM_CONFERENCIA_LOJA') {
      throw new Error(`Documento ${data.invoice_external_id} não pode escanear itens pois seu status é ${transaction.status}. Esperado: EM_CONFERENCIA_LOJA.`);
    }

    // Coletar e analisar todos os itens escaneados
    const existingItems = transaction.attributes.items_scanned || [];
    const newScannedItems = [...existingItems, ...data.items];

    // Determinar se há divergências
    let hasDiscrepancy = false;
    for (const item of data.items) {
      if (item.qty_diff && item.qty_diff !== 0) {
        hasDiscrepancy = true;
        break;
      }
    }

    // Determinar o status final baseado nas divergências
    const newStatus = hasDiscrepancy ? 'CONFERENCIA_LOJA_COM_DIVERGENCIA' : 'CONFERENCIA_LOJA_SEM_DIVERGENCIA';

    // Atualizar o documento com os itens escaneados e o novo status
    const { data: updatedTx, error } = await this.supabase.from('tenant_business_transactions')
      .update({ 
        status: newStatus,
        attributes: { 
          ...transaction.attributes, 
          status: newStatus,
          items_scanned: newScannedItems,
          ultima_conferencia_em: new Date().toISOString() 
        } 
      })
      .eq('id', transaction.id)
      .select()
      .single();
    if(error) throw error;

    await this._createBusinessEvent('TRANSACTION', transaction.id, 'store_items_scanned', { ...data, ...metadata });

    return {
      transaction_id: transaction.id,
      external_id: transaction.external_id,
      status: newStatus,
      success: true,
      entityType: 'STORE_SCAN',
      entityId: transaction.id,
      summary: {
        message: `Store items scanned with status: ${newStatus}`,
        records_processed: 1,
        records_successful: 1,
        records_failed: 0
      }
    };
  }

  private async _completeStoreConference(data: any, metadata?: any) {
    if (!data.invoice_external_id || !data.items_received) throw new Error('invoice_external_id e items_received são obrigatórios.');
    const transaction = await this._getTransactionByExternalId(data.invoice_external_id, 'TRANSFER_IN');

    // Validar que o status atual é EM_CONFERENCIA_LOJA
    if (transaction.status !== 'EM_CONFERENCIA_LOJA') {
      throw new Error(`Documento ${data.invoice_external_id} não está em conferência na loja. Status atual: ${transaction.status}.`);
    }

    // Determinar o status final da conferência e coletar divergências
    let hasDiscrepancy = false;
    const discrepancies: TransferDiscrepancy[] = [];
    for (const item of data.items_received) {
      if (item.qty_diff && item.qty_diff !== 0) {
        hasDiscrepancy = true;
        discrepancies.push({ sku: item.product_external_id, qty_expected: item.qty_expected, qty_received: item.qty_received, qty_diff: item.qty_diff });
      }
    }

    const newStatus = hasDiscrepancy ? 'CONFERENCIA_LOJA_COM_DIVERGENCIA' : 'CONFERENCIA_LOJA_SEM_DIVERGENCIA';

    // Atualizar o status do documento
    const { data: updatedTx, error } = await this.supabase.from('tenant_business_transactions')
      .update({ 
        status: newStatus,
        attributes: { ...transaction.attributes, status: newStatus, conferencia_loja_finalizada_em: new Date().toISOString(), divergencias: discrepancies } 
      })
      .eq('id', transaction.id)
      .select()
      .single();
    if(error) throw error;

    await this._createBusinessEvent('TRANSACTION', transaction.id, 'store_conference_completed', { ...data, ...metadata });

    return {
      transaction_id: transaction.id,
      external_id: transaction.external_id,
      status: newStatus,
      success: true,
      entityType: 'STORE_CONFERENCE',
      entityId: transaction.id,
      summary: {
        message: `Store conference completed with status: ${newStatus}`,
        records_processed: 1,
        records_successful: 1,
        records_failed: 0
      }
    };
  }

  private async _effectuateStore(data: any, metadata?: any) {
    if (!data.invoice_external_id) throw new Error('invoice_external_id é obrigatório.');
    const transaction = await this._getTransactionByExternalId(data.invoice_external_id, 'TRANSFER_IN');

    // Validar que o status atual é CONFERENCIA_LOJA_SEM_DIVERGENCIA ou CONFERENCIA_LOJA_COM_DIVERGENCIA
    if (transaction.status !== 'CONFERENCIA_LOJA_SEM_DIVERGENCIA' && 
        transaction.status !== 'CONFERENCIA_LOJA_COM_DIVERGENCIA') {
      throw new Error(`Documento ${data.invoice_external_id} não pode ser efetivado pois seu status é ${transaction.status}. Esperado: CONFERENCIA_LOJA_SEM_DIVERGENCIA ou CONFERENCIA_LOJA_COM_DIVERGENCIA.`);
    }

    // Atualizar o status para EFETIVADO_LOJA
    const { data: updatedTx, error } = await this.supabase.from('tenant_business_transactions')
      .update({ 
        status: 'EFETIVADO_LOJA',
        attributes: { ...transaction.attributes, status: 'EFETIVADO_LOJA', efetivado_loja_em: new Date().toISOString() } 
      })
      .eq('id', transaction.id)
      .select()
      .single();
    if(error) throw error;

    await this._createBusinessEvent('TRANSACTION', transaction.id, 'store_effectuated', { ...data, ...metadata });

    return {
      transaction_id: transaction.id,
      external_id: transaction.external_id,
      status: 'EFETIVADO_LOJA',
      success: true,
      entityType: 'STORE_EFFECTUATION',
      entityId: transaction.id,
      summary: {
        message: 'Store effectuated successfully',
        records_processed: 1,
        records_successful: 1,
        records_failed: 0
      }
    };
  }

  private async _registerReceipt(data: any, metadata?: any) {
    const transferExternalId = data.transfer_external_id || data.external_id;
    const transaction = await this._getTransactionByExternalId(transferExternalId, 'TRANSFER_OUT');

    // Validar que o status atual é EMBARCADO_CD ou TRANSFERENCIA_CDH_FATURADA
    if (transaction.status !== 'EMBARCADO_CD' && transaction.status !== 'TRANSFERENCIA_CDH_FATURADA') {
      throw new Error(`Transferência ${transferExternalId} não pode registrar recebimento pois seu status é ${transaction.status}. Esperado: EMBARCADO_CD ou TRANSFERENCIA_CDH_FATURADA.`);
    }

    // Atualizar o status para AGUARDANDO_CONFERENCIA_LOJA
    const { data: updatedTx, error } = await this.supabase.from('tenant_business_transactions')
      .update({ 
        status: 'AGUARDANDO_CONFERENCIA_LOJA',
        attributes: { ...transaction.attributes } 
      })
      .eq('id', transaction.id)
      .select()
      .single();
    if(error) throw error;

    await this._createBusinessEvent('TRANSACTION', transaction.id, 'transfer_received', { ...data, ...metadata });

    return {
      transaction_id: transaction.id,
      external_id: transaction.external_id,
      status: 'AGUARDANDO_CONFERENCIA_LOJA',
      success: true,
      entityType: 'RECEIPT_REGISTRATION',
      entityId: transaction.id,
      summary: {
        message: 'Receipt registered successfully',
        records_processed: 1,
        records_successful: 1,
        records_failed: 0
      }
    };
  }

  private async _registerCompletion(data: any, metadata?: any) {
    const transferExternalId = data.transfer_external_id || data.external_id;
    if (!transferExternalId || !data.items_received) throw new Error('transfer_external_id e items_received são obrigatórios.');
    const transaction = await this._getTransactionByExternalId(transferExternalId, 'TRANSFER_OUT');

    // Validar que o status atual é AGUARDANDO_CONFERENCIA_LOJA ou EM_CONFERENCIA_LOJA
    if (transaction.status !== 'AGUARDANDO_CONFERENCIA_LOJA' && transaction.status !== 'EM_CONFERENCIA_LOJA') {
      throw new Error(`Transferência ${transferExternalId} não pode ser concluída pois seu status é ${transaction.status}. Esperado: AGUARDANDO_CONFERENCIA_LOJA ou EM_CONFERENCIA_LOJA.`);
    }

    // Determinar o status final da conferência e coletar divergências (se aplicável)
    let hasDiscrepancy = false;
    const discrepancies: TransferDiscrepancy[] = [];
    for (const item of data.items_received) {
      if (item.qty_diff && item.qty_diff !== 0) {
        hasDiscrepancy = true;
        discrepancies.push({ sku: item.product_id, qty_expected: item.qty_expected, qty_received: item.qty_received, qty_diff: item.qty_diff });
      }
    }

    const newStatus = hasDiscrepancy ? 'CONFERENCIA_LOJA_COM_DIVERGENCIA' : 'CONFERENCIA_LOJA_SEM_DIVERGENCIA';

    // Atualizar o status para EFETIVADO_LOJA ou CONFERENCIA_LOJA_COM_DIVERGENCIA/SEM_DIVERGENCIA
    const { data: updatedTx, error } = await this.supabase.from('tenant_business_transactions')
      .update({ 
        status: newStatus,
        attributes: { ...transaction.attributes, conferencia_loja_finalizada_em: new Date().toISOString(), divergencias: discrepancies } 
      })
      .eq('id', transaction.id)
      .select()
      .single();
    if(error) throw error;

    await this._createBusinessEvent('TRANSACTION', transaction.id, 'transfer_completed', { ...data, ...metadata });

    // Criar movimentação de estoque de entrada na Loja
    const destinationLocationEntity = await this._getOrCreateBusinessEntity(
      BANBAN_ORG_ID,
      'LOCATION' as EntityType,
      transaction.attributes.destination_location_external_id,
      { name: transaction.attributes.destination_location_name }
    );

    for (const item of data.items_received) {
      const productEntity = await this._getOrCreateBusinessEntity(
        BANBAN_ORG_ID,
        'PRODUCT',
        item.product_id,
        { name: item.product_name || `Produto ${item.product_id}` }
      );

      const inventoryMovement = await createBusinessTransaction(
        BANBAN_ORG_ID,
        'INVENTORY_MOVEMENT',
        null, // external_id pode ser nulo para movimentos internos
        {
          qty_change: item.qty_received,
          movement_type: 'TRANSFER_IN',
          reference_transfer_id: transaction.id,
          reference_transfer_external_id: transaction.external_id,
          product_external_id: item.product_id,
          location_external_id: transaction.attributes.destination_location_external_id,
          ...item
        }
      );

      await createBusinessRelationship(
        BANBAN_ORG_ID,
        'AFFECTS_PRODUCT',
        inventoryMovement.id,
        productEntity.id,
        {}
      );
      await createBusinessRelationship(
        BANBAN_ORG_ID,
        'AT_LOCATION',
        inventoryMovement.id,
        destinationLocationEntity.id,
        {}
      );
      await createBusinessRelationship(
        BANBAN_ORG_ID,
        'CAUSED_BY_TRANSFER',
        inventoryMovement.id,
        transaction.id,
        {}
      );

      await this._updateInventorySnapshot(
        item.product_id,
        transaction.attributes.destination_location_external_id,
        item.qty_received,
        'TRANSFER_IN',
        inventoryMovement.id
      );
    }

    await this._updateAnalyticsSnapshots({ ...transaction.attributes, ...data });

    return {
      transaction_id: transaction.id,
      external_id: transaction.external_id,
      status: newStatus,
      success: true,
      entityType: 'STORE_CONFERENCE',
      entityId: transaction.id,
      summary: {
        message: `Store conference completed with status: ${newStatus}`,
        records_processed: 1,
        records_successful: 1,
        records_failed: 0
      }
    };
  }

  // --- MÉTODOS DE ANALYTICS E AUXILIARES ---

  private async _updateAnalyticsSnapshots(transferData: any) {
    const { origin_location_external_id, destination_location_external_id } = transferData;

    const routePerformance = await this._calculateRoutePerformance(origin_location_external_id, destination_location_external_id);
    await this._updateSnapshot('TRANSFER_PERFORMANCE', `route_${origin_location_external_id}_${destination_location_external_id}`, routePerformance);

    const demandPatterns = await this._analyzeDemandPatterns(destination_location_external_id);
    await this._updateSnapshot('LOCATION_DEMAND', `demand_${destination_location_external_id}`, demandPatterns);
  }

  private async _calculateRoutePerformance(originId: string, destId: string) {
    
    try {
      // Buscar transferências completadas entre as localizações nos últimos 90 dias
      const { data: transfers, error } = await this.supabase
        .from('tenant_business_transactions')
        .select(`
          id, external_id, attributes, created_at, updated_at,
          tenant_business_relationships!inner(
            relationship_type,
            tenant_business_entities!inner(
              external_id,
              entity_type
            )
          )
        `)
        .eq('organization_id', BANBAN_ORG_ID)
        .in('transaction_type', ['TRANSFER_OUT', 'TRANSFER_IN'])
        .in('status', ['TRANSFERENCIA_CDH_FATURADA', 'EFETIVADO_LOJA'])
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`[RoutePerformance] Erro ao buscar transferências ${originId} -> ${destId}:`, error);
        throw error;
      }

      const transferData = transfers || [];
      
      // Filtrar transferências específicas da rota
      const routeTransfers = transferData.filter((transfer: any) => {
        const relationships = Array.isArray(transfer.tenant_business_relationships) 
          ? transfer.tenant_business_relationships 
          : transfer.tenant_business_relationships ? [transfer.tenant_business_relationships] : [];
        
        const locations = relationships
          .filter((rel: any) => rel.tenant_business_entities?.entity_type === 'LOCATION')
          .map((rel: any) => rel.tenant_business_entities.external_id);
        
        return locations.includes(originId) && locations.includes(destId);
      });

      const totalTransfers = routeTransfers.length;
      
      if (totalTransfers === 0) {
        return {
          route: `${originId} -> ${destId}`,
          total_transfers: 0,
          avg_lead_time_hours: '0.0',
          on_time_rate: '0.0',
          accuracy_rate: '0.0',
          last_updated: new Date().toISOString()
        };
      }

      // Calcular lead time médio
      const leadTimes = routeTransfers
        .filter((transfer: any) => transfer.updated_at && transfer.created_at)
        .map((transfer: any) => {
          const start = new Date(transfer.created_at);
          const end = new Date(transfer.updated_at!);
          return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // em horas
        });
      
      const avgLeadTime = leadTimes.length > 0 
        ? (leadTimes.reduce((sum: number, time: number) => sum + time, 0) / leadTimes.length)
        : 0;

      // Calcular taxa de pontualidade (baseada em lead time < 48h)
      const onTimeTransfers = leadTimes.filter((time: number) => time <= 48).length;
      const onTimeRate = leadTimes.length > 0 
        ? (onTimeTransfers / leadTimes.length) * 100
        : 0;

      // Calcular taxa de precisão (baseada em divergências)
      const accurateTransfers = routeTransfers.filter((transfer: any) => {
        const divergences = transfer.attributes?.divergencias || [];
        return Array.isArray(divergences) && divergences.length === 0;
      }).length;
      
      const accuracyRate = totalTransfers > 0 
        ? (accurateTransfers / totalTransfers) * 100
        : 0;

      return {
        route: `${originId} -> ${destId}`,
        total_transfers: totalTransfers,
        avg_lead_time_hours: avgLeadTime.toFixed(1),
        on_time_rate: onTimeRate.toFixed(1),
        accuracy_rate: accuracyRate.toFixed(1),
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`[RoutePerformance] Erro ao calcular performance da rota ${originId} -> ${destId}:`, error);
      // Fallback para dados básicos
      return {
        route: `${originId} -> ${destId}`,
        total_transfers: 0,
        avg_lead_time_hours: '0.0',
        on_time_rate: '0.0',
        accuracy_rate: '0.0',
        last_updated: new Date().toISOString()
      };
    }
  }

  private async _analyzeDemandPatterns(destId: string) {
    
    try {
      // Buscar transferências recebidas pela localização nos últimos 6 meses
      const { data: transfers, error } = await this.supabase
        .from('tenant_business_transactions')
        .select(`
          id, external_id, attributes, created_at,
          tenant_business_relationships!inner(
            relationship_type,
            attributes,
            tenant_business_entities!inner(
              external_id,
              entity_type
            )
          )
        `)
        .eq('organization_id', BANBAN_ORG_ID)
        .eq('transaction_type', 'TRANSFER_IN')
        .in('status', ['CONFERENCIA_LOJA_SEM_DIVERGENCIA', 'CONFERENCIA_LOJA_COM_DIVERGENCIA', 'EFETIVADO_LOJA'])
        .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`[DemandPatterns] Erro ao buscar transferências para ${destId}:`, error);
        throw error;
      }

      const transferData = transfers || [];
      
      // Filtrar transferências para a localização específica
      const locationTransfers = transferData.filter((transfer: any) => {
        const relationships = Array.isArray(transfer.tenant_business_relationships) 
          ? transfer.tenant_business_relationships 
          : transfer.tenant_business_relationships ? [transfer.tenant_business_relationships] : [];
        
        return relationships.some((rel: any) => 
          rel.tenant_business_entities?.entity_type === 'LOCATION' && 
          rel.tenant_business_entities.external_id === destId
        );
      });

      const totalTransfers = locationTransfers.length;
      
      if (totalTransfers === 0) {
        return {
          location: destId,
          total_transfers_received: 0,
          avg_monthly_transfers: '0.0',
          critical_products: [],
          last_updated: new Date().toISOString()
        };
      }

      // Calcular média mensal de transferências (nos últimos 6 meses)
      const avgMonthlyTransfers = totalTransfers / 6;

      // Analisar produtos mais transferidos (críticos)
      const productFrequency = new Map<string, { total_qty: number, frequency: number }>();
      
      for (const transfer of locationTransfers) {
        const relationships = Array.isArray(transfer.tenant_business_relationships) 
          ? transfer.tenant_business_relationships 
          : transfer.tenant_business_relationships ? [transfer.tenant_business_relationships] : [];
        
        for (const rel of relationships) {
          if (rel?.tenant_business_entities && !Array.isArray(rel.tenant_business_entities) && (rel.tenant_business_entities as any).entity_type === 'PRODUCT') {
            const productId = (rel.tenant_business_entities as any).external_id;
            const quantity = parseInt(rel.attributes?.quantity || '1');
            
            if (!productFrequency.has(productId)) {
              productFrequency.set(productId, { total_qty: 0, frequency: 0 });
            }
            
            const stats = productFrequency.get(productId)!;
            stats.total_qty += quantity;
            stats.frequency += 1;
          }
        }
      }

      // Ordenar produtos por frequência de transferência
      const criticalProducts = Array.from(productFrequency.entries())
        .sort((a, b) => b[1].frequency - a[1].frequency)
        .slice(0, 10)
        .map(([variant_external_id, stats]) => ({
          variant_external_id,
          total_qty: stats.total_qty,
          frequency: stats.frequency
        }));

      return {
        location: destId,
        total_transfers_received: totalTransfers,
        avg_monthly_transfers: avgMonthlyTransfers.toFixed(1),
        critical_products: criticalProducts,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`[DemandPatterns] Erro ao analisar padrões de demanda para ${destId}:`, error);
      // Fallback para dados básicos
      return {
        location: destId,
        total_transfers_received: 0,
        avg_monthly_transfers: '0.0',
        critical_products: [],
        last_updated: new Date().toISOString()
      };
    }
  }

  private async _updateSnapshot(snapshotType: string, snapshotKey: string, value: Record<string, unknown>) {
    const { error } = await this.supabase.from('tenant_snapshots').upsert({
      organization_id: BANBAN_ORG_ID,
      snapshot_type: snapshotType,
      snapshot_key: snapshotKey,
      snapshot_value: value,
      snapshot_date: new Date().toISOString().split('T')[0]
    }, { onConflict: 'organization_id,snapshot_key' });
    if (error) console.error(`[_updateSnapshot] Erro ao atualizar snapshot ${snapshotKey}:`, error);
  }

  private async _getTransactionByExternalId(externalId: string, transactionType: string = 'TRANSFER_OUT') {
    const { data, error } = await this.supabase.from('tenant_business_transactions').select('*').eq('organization_id', BANBAN_ORG_ID).eq('external_id', externalId).eq('transaction_type', transactionType).single();
    if (error || !data) throw new Error(`Transação do tipo ${transactionType} com ID externo ${externalId} não encontrada.`);
    return data;
  }

  

  private async _createBusinessEvent(entityType: string, entityId: string, eventCode: string, eventData: Record<string, unknown>) {
    const { error } = await this.supabase.from('tenant_business_events').insert({
        organization_id: BANBAN_ORG_ID,
        entity_type: entityType,
        entity_id: entityId,
        event_code: eventCode,
        event_data: eventData
    });
    if (error) console.error(`[_createBusinessEvent] Erro ao registrar evento:`, error);
  }

  private async _updateInventorySnapshot(variantExternalId: string, locationExternalId: string, qtyChange: number, movementType: string, referenceId: string) {
    const snapshotKey = `stock_${variantExternalId}_${locationExternalId}`;
    const { data: existing } = await this.supabase.from('tenant_snapshots').select('*').eq('organization_id', BANBAN_ORG_ID).eq('snapshot_key', snapshotKey).single();
    
    const stock = existing?.snapshot_value || {};
    stock.current_stock = (stock.current_stock || 0) + qtyChange;
    stock.last_movement = movementType;
    stock.last_movement_ref = referenceId;
    stock.last_updated = new Date().toISOString();

    const { error } = await this.supabase.from('tenant_snapshots').upsert({ 
        organization_id: BANBAN_ORG_ID, 
        snapshot_type: 'INVENTORY', 
        snapshot_key: snapshotKey, 
        snapshot_value: stock, 
        snapshot_date: new Date().toISOString().split('T')[0] 
    }, { onConflict: 'organization_id,snapshot_key' });

    if(error) {
        console.error(`[_updateInventorySnapshot] Erro ao atualizar snapshot de inventário:`, error);
        throw error;
    }
  }

  private async _getOrCreateBusinessEntity(organizationId: string, entityType: EntityType, externalId: string, initialData: Record<string, unknown>): Promise<BusinessEntity> {
    let entity = await getECAEntityByExternalId(
      entityType,
      externalId,
      organizationId
    );

    if (!entity) {
      entity = await upsertECABusinessEntity(entityType, externalId, initialData, undefined, organizationId);
    }
    return entity;
  }

  // ================================================
  // NOTA: MÉTODOS LEGACY ACIMA
  // ================================================
  // Todos os métodos privados de _registerRequest, _createSeparationMap, etc. são mantidos
  // apenas para compatibilidade com o sistema atual. Para novos desenvolvimentos,
  // use a arquitetura ECA via processECAWebhook() que automaticamente:
  // 
  // 1. Valida ações usando enums centralizados TRANSFER_ACTIONS
  // 2. Gerencia transições de estado via máquina de estados
  // 3. Cria entidades, transações e relacionamentos automaticamente
  // 4. Mantém histórico completo de transições
  // 5. Fornece rastreabilidade completa conforme ECA.md
  //
  // TODO: Migrar gradualmente todos os clients para usar processECAWebhook()
  // TODO: Deprecar e remover métodos legacy após migração completa
}
