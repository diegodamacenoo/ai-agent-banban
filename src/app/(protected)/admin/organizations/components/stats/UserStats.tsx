import { Users, UserCheck, Shield } from 'lucide-react';
import type { UserStats } from '../../types';

interface UserStatsProps {
  userStats: UserStats;
}

/**
 * Componente de estatísticas de usuários
 * Mostra métricas principais dos usuários do sistema
 */
export const UserStatsComponent = ({ userStats }: UserStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium">Total</span>
        </div>
        <div className="text-2xl font-bold">{userStats.total}</div>
      </div>
      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium">Ativos</span>
        </div>
        <div className="text-2xl font-bold text-green-600">{userStats.active}</div>
      </div>
      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-600" />
          <span className="text-sm font-medium">Admins</span>
        </div>
        <div className="text-2xl font-bold text-red-600">{userStats.admins}</div>
      </div>
      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium">Gestores</span>
        </div>
        <div className="text-2xl font-bold">{userStats.managers}</div>
      </div>
    </div>
  );
};