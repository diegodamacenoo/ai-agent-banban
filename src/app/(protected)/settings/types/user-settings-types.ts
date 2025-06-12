export const userRoleOptions = ["organization_admin", "editor", "reader", "visitor"] as const;
export type UserRole = typeof userRoleOptions[number]; 