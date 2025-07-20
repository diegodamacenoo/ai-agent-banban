-- Registrar widgets do BanBan no sistema
INSERT INTO public.dashboard_widgets (
    id,
    title,
    description,
    component_path,
    module_id,
    query_type,
    query_config,
    default_params,
    default_width,
    default_height,
    category,
    tags,
    version,
    is_active
)
VALUES
-- Dashboard Executivo
(
    gen_random_uuid(),
    'Dashboard Executivo',
    'Visão geral dos KPIs principais do negócio',
    '/widgets/banban/executive-dashboard',
    'banban-performance',
    'rpc',
    jsonb_build_object(
        'function', 'get_executive_kpis',
        'params', jsonb_build_object('period', '30d')
    ),
    jsonb_build_object(
        'period', '30d',
        'showTrends', true,
        'showAlerts', true
    ),
    12,
    6,
    'executive',
    ARRAY['kpis', 'performance', 'executive'],
    '1.0.0',
    true
),
-- KPIs Fashion
(
    gen_random_uuid(),
    'KPIs Fashion',
    'Métricas específicas para o varejo de moda',
    '/widgets/banban/fashion-kpis',
    'banban-performance',
    'rpc',
    jsonb_build_object(
        'function', 'get_fashion_kpis',
        'params', jsonb_build_object('period', '30d')
    ),
    jsonb_build_object(
        'period', '30d',
        'showCategories', true,
        'showSeasonalScore', true,
        'showTrends', true,
        'showSizes', true,
        'showColors', true
    ),
    8,
    8,
    'fashion',
    ARRAY['kpis', 'fashion', 'trends', 'performance'],
    '1.0.0',
    true
),
-- Insights Board
(
    gen_random_uuid(),
    'Insights Board',
    'Painel de insights automáticos com recomendações',
    '/widgets/banban/insights-board',
    'banban-insights',
    'rpc',
    jsonb_build_object(
        'function', 'get_latest_insights',
        'params', jsonb_build_object(
            'limit', 10,
            'confidence_threshold', 70
        )
    ),
    jsonb_build_object(
        'maxInsights', 10,
        'showFilters', true,
        'confidenceThreshold', 70,
        'categories', ARRAY['opportunity', 'risk', 'trend', 'recommendation']
    ),
    6,
    8,
    'insights',
    ARRAY['insights', 'recommendations', 'ai', 'analysis'],
    '1.0.0',
    true
); 