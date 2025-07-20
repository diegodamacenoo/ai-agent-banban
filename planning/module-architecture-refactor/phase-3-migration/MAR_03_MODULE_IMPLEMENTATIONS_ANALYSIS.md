[
  {
    "id": "2aa4eb8d-830e-45e4-b16f-1960614fba67",
    "module_id": "ac5e12a0-6b64-4f88-832a-935091580ccc",
    "module_type": "custom",
    "component_path": "@/clients/banban/components/BanbanAnalytics",
    "name": "Analytics Gerais",
    "icon_name": "PieChart",
    "permissions": [
      "analytics.view"
    ],
    "config": {
      "dashboards": [
        "sales",
        "customers"
      ]
    },
    "is_available": true,
    "created_at": "2025-07-02 13:19:56.668196",
    "updated_at": "2025-07-05 20:07:21.906721",
    "customization_level": "standard",
    "implementation_notes": null
  },
  {
    "id": "ad2abc57-79f0-47f0-b674-c52e08547bad",
    "module_id": "d6a24f70-569f-4472-9c70-c4d6fe2ca93e",
    "module_type": "custom",
    "component_path": "@/clients/banban/components/BanbanDataProcessing",
    "name": "Processamento de Dados",
    "icon_name": "Database",
    "permissions": [
      "data.process",
      "data.admin"
    ],
    "config": {
      "batch_size": 1000,
      "parallel_jobs": 4
    },
    "is_available": true,
    "created_at": "2025-07-02 13:19:56.668196",
    "updated_at": "2025-07-05 20:07:21.906721",
    "customization_level": "standard",
    "implementation_notes": null
  },
  {
    "id": "9283fdf8-f24b-4f69-825e-25ee54c5aea6",
    "module_id": "f5a06be6-3f3d-46b2-8327-af8e3977c1eb",
    "module_type": "custom",
    "component_path": "@/clients/banban/components/BanbanInsightsHome",
    "name": "Insights Avançados",
    "icon_name": "BarChart3",
    "permissions": [
      "insights.view",
      "insights.export"
    ],
    "config": {
      "theme": "default",
      "features": [
        "dashboard",
        "analytics",
        "reports"
      ]
    },
    "is_available": true,
    "created_at": "2025-07-02 13:19:56.668196",
    "updated_at": "2025-07-05 20:07:21.906721",
    "customization_level": "standard",
    "implementation_notes": null
  },
  {
    "id": "e501c20c-6362-4621-83b2-ea294dd5b7d1",
    "module_id": "7238cd5d-6984-4eb5-9959-dcb3f7932425",
    "module_type": "custom",
    "component_path": "@/clients/banban/components/performance/PerformancePage",
    "name": "Performance Fashion",
    "icon_name": "Activity",
    "permissions": [
      "performance.view",
      "performance.export"
    ],
    "config": {
      "theme": "default",
      "specialization": "fashion"
    },
    "is_available": true,
    "created_at": "2025-07-02 13:19:56.668196",
    "updated_at": "2025-07-05 20:07:21.906721",
    "customization_level": "standard",
    "implementation_notes": null
  },
  {
    "id": "257e026a-3227-436b-ac4b-d91eb26f555d",
    "module_id": "46b14310-363c-4208-a1e8-7d1f1329501e",
    "module_type": "custom",
    "component_path": "@/clients/banban/components/BanbanAlertsManager",
    "name": "Alertas Inteligentes",
    "icon_name": "Bell",
    "permissions": [
      "alerts.view",
      "alerts.manage",
      "alerts.configure"
    ],
    "config": {
      "theme": "default",
      "auto_notifications": true
    },
    "is_available": true,
    "created_at": "2025-07-02 13:19:56.668196",
    "updated_at": "2025-07-05 20:07:21.906721",
    "customization_level": "standard",
    "implementation_notes": null
  },
  {
    "id": "0b32944d-6bc8-4f68-aebe-6daeac571e59",
    "module_id": "e17fb79d-bbae-47a1-ad79-9b23ab279150",
    "module_type": "custom",
    "component_path": "@/clients/banban/components/BanbanInventoryAnalytics",
    "name": "Gestão de Estoque",
    "icon_name": "Package",
    "permissions": [
      "inventory.view",
      "inventory.manage",
      "inventory.adjust"
    ],
    "config": {
      "theme": "default",
      "real_time": true
    },
    "is_available": true,
    "created_at": "2025-07-02 13:19:56.668196",
    "updated_at": "2025-07-05 20:07:21.906721",
    "customization_level": "standard",
    "implementation_notes": null
  },
  {
    "id": "d4d40f98-d328-4533-aec5-9b3bb30e6f03",
    "module_id": "ac5e12a0-6b64-4f88-832a-935091580ccc",
    "module_type": "banban",
    "component_path": "@/clients/banban/components/BanbanAnalytics",
    "name": "Analytics Avançado",
    "icon_name": "TrendingUp",
    "permissions": [
      "analytics.view",
      "analytics.trends",
      "analytics.forecasts"
    ],
    "config": {
      "theme": "banban",
      "advanced_features": true
    },
    "is_available": true,
    "created_at": "2025-07-02 13:19:56.668196",
    "updated_at": "2025-07-05 20:07:21.906721",
    "customization_level": "client-specific",
    "implementation_notes": "Highly customized implementation with client-specific business logic and UI adaptations"
  }
]