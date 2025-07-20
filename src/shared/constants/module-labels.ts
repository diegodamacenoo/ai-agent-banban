export const MODULE_STATUS_LABELS = {
  PLANNED: 'Planejado',
  IMPLEMENTED: 'Implementado',
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  PAUSED: 'Pausado',
  CANCELLED: 'Cancelado',
  INCOMPLETE: 'Incompleto',
  BROKEN: 'Com Erro',
  MISSING_FILES: 'Arquivos Faltando',
  DISCOVERED: 'Descoberto',
  MISSING: 'Ausente',
  ORPHANED: 'Órfão',
  ARCHIVED: 'Arquivado'
} as const;

export const MODULE_STATUS_COLORS = {
  PLANNED: 'bg-blue-100 text-blue-800 border-blue-200',
  IMPLEMENTED: 'bg-green-100 text-green-800 border-green-200',
  ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
  PAUSED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  INCOMPLETE: 'bg-orange-100 text-orange-800 border-orange-200',
  BROKEN: 'bg-red-100 text-red-800 border-red-200',
  MISSING_FILES: 'bg-amber-100 text-amber-800 border-amber-200',
  DISCOVERED: 'bg-blue-100 text-blue-800 border-blue-200',
  MISSING: 'bg-red-100 text-red-800 border-red-200',
  ORPHANED: 'bg-orange-100 text-orange-800 border-orange-200',
  ARCHIVED: 'bg-gray-100 text-gray-800 border-gray-200'
} as const; 