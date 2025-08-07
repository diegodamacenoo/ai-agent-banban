// ================================================
// API HANDLERS - MÓDULO BANBAN PERFORMANCE
// ================================================

import type { FastifyRequest, FastifyReply, ApiResponse } from '../types';
import { 
  FashionMetricsService, 
  InventoryTurnoverService, 
  DashboardService, 
  AnalyticsService 
} from '../services';

export class ApiHandlers {
  /**
   * Handler para métricas de moda
   */
  static async getFashionMetrics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = (request as any).organizationId || 'default';
      const metrics = await FashionMetricsService.calculateFashionMetrics(organizationId);
      
      const response: ApiResponse = {
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      };
      
      return reply.code(200).send(response);
    } catch (error) {
      console.error('Erro ao calcular métricas de moda:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handler para turnover de inventário
   */
  static async getInventoryTurnover(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = (request as any).organizationId || 'default';
      const turnover = await InventoryTurnoverService.calculateInventoryTurnover(organizationId);
      
      const response: ApiResponse = {
        success: true,
        data: turnover,
        timestamp: new Date().toISOString()
      };
      
      return reply.code(200).send(response);
    } catch (error) {
      console.error('Erro ao calcular turnover:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handler para análise sazonal
   */
  static async getSeasonalAnalysis(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = (request as any).organizationId || 'default';
      const seasonalData = await AnalyticsService.getSeasonalAnalysis(organizationId);

      const response: ApiResponse = {
        success: true,
        data: seasonalData,
        timestamp: new Date().toISOString()
      };

      return reply.code(200).send(response);
    } catch (error) {
      console.error('Erro na análise sazonal:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handler para performance de marca
   */
  static async getBrandPerformance(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = (request as any).organizationId || 'default';
      const brandData = await DashboardService.getBrandPerformance(organizationId);

      const response: ApiResponse = {
        success: true,
        data: brandData,
        timestamp: new Date().toISOString()
      };

      return reply.code(200).send(response);
    } catch (error) {
      console.error('Erro na performance da marca:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handler para dashboard executivo
   */
  static async getExecutiveDashboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = (request as any).organizationId || 'default';
      const dashboardData = await DashboardService.getExecutiveDashboard(organizationId);

      const response: ApiResponse = {
        success: true,
        data: dashboardData,
        timestamp: new Date().toISOString()
      };

      return reply.code(200).send(response);
    } catch (error) {
      console.error('Erro no dashboard executivo:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handler para margens de produto
   */
  static async getProductMargins(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = (request as any).organizationId || 'default';
      const marginData = await DashboardService.getProductMargins(organizationId);

      const response: ApiResponse = {
        success: true,
        data: marginData,
        timestamp: new Date().toISOString()
      };

      return reply.code(200).send(response);
    } catch (error) {
      console.error('Erro nas margens de produto:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handler para previsões
   */
  static async getForecast(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = (request as any).organizationId || 'default';
      const months = parseInt((request.query)?.months) || 3;
      const forecast = await AnalyticsService.getForecast(organizationId, months);

      const response: ApiResponse = {
        success: true,
        data: forecast,
        timestamp: new Date().toISOString()
      };

      return reply.code(200).send(response);
    } catch (error) {
      console.error('Erro ao gerar previsão:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handler para tendências de crescimento
   */
  static async getGrowthTrends(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = (request as any).organizationId || 'default';
      const period = (request.query)?.period || 'monthly';
      const trends = await AnalyticsService.getGrowthTrends(organizationId, period);

      const response: ApiResponse = {
        success: true,
        data: trends,
        timestamp: new Date().toISOString()
      };

      return reply.code(200).send(response);
    } catch (error) {
      console.error('Erro ao obter tendências:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handler para alertas consolidados
   */
  static async getAlerts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = (request as any).organizationId || 'default';
      const alerts = await DashboardService.generateAlerts(organizationId);

      const response: ApiResponse = {
        success: true,
        data: alerts,
        timestamp: new Date().toISOString()
      };

      return reply.code(200).send(response);
    } catch (error) {
      console.error('Erro ao gerar alertas:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  }
} 