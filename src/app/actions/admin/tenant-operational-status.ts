'use server';

import { createSupabaseServerClient } from "@/core/supabase/server";
import { revalidatePath } from "next/cache";

// Types for the operational status system
export interface ModuleApprovalRequest {
  id: string;
  organization_id: string;
  module_id: string;
  requested_by: string;
  request_reason?: string;
  request_metadata?: Record<string, any>;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
}

export interface ModulePolicy {
  module_id: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
  request_policy: 'AUTO_APPROVE' | 'MANUAL_APPROVAL' | 'DISABLED';
  auto_enable_policy: 'ALL_TENANTS' | 'NEW_TENANTS' | 'NONE';
  updated_by: string;
  updated_at: string;
}

/**
 * Get all pending approval requests
 */
export async function getPendingApprovalRequests(): Promise<{
  success: boolean;
  data?: ModuleApprovalRequest[];
  error?: string;
}> {
  const supabase = await createSupabaseServerClient();

  try {
    // First, get the pending module approval requests
    const { data: requests, error: requestsError } = await supabase
      .from('module_approval_requests')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching pending requests:', requestsError);
      return { success: false, error: requestsError.message };
    }

    if (!requests || requests.length === 0) {
      return { success: true, data: [] };
    }

    // Get unique module IDs and user IDs
    const moduleIds = [...new Set(requests.map(r => r.module_id))];
    const userIds = [...new Set([
      ...requests.map(r => r.requested_by).filter(Boolean),
      ...requests.map(r => r.reviewed_by).filter(Boolean)
    ])];

    // Fetch modules data
    const { data: modules } = await supabase
      .from('core_modules')
      .select('*')
      .in('module_id', moduleIds);

    // Fetch user profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', userIds);

    // Combine the data
    const enrichedRequests = requests.map(request => ({
      ...request,
      module: modules?.find(m => m.module_id === request.module_id),
      requester: profiles?.find(p => p.id === request.requested_by),
      reviewer: profiles?.find(p => p.id === request.reviewed_by)
    }));

    return { success: true, data: enrichedRequests as ModuleApprovalRequest[] };
  } catch (e: any) {
    console.error('Unexpected error in getPendingApprovalRequests:', e);
    return { success: false, error: e.message || 'An unexpected error occurred' };
  }
}

/**
 * Get approval requests for a specific organization
 */
export async function getOrganizationApprovalRequests(organizationId: string): Promise<{
  success: boolean;
  data?: ModuleApprovalRequest[];
  error?: string;
}> {
  const supabase = await createSupabaseServerClient();

  try {
    // First, get the module approval requests
    const { data: requests, error: requestsError } = await supabase
      .from('module_approval_requests')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching organization requests:', requestsError);
      return { success: false, error: requestsError.message };
    }

    if (!requests || requests.length === 0) {
      return { success: true, data: [] };
    }

    // Get unique module IDs and user IDs
    const moduleIds = [...new Set(requests.map(r => r.module_id))];
    const userIds = [...new Set([
      ...requests.map(r => r.requested_by).filter(Boolean),
      ...requests.map(r => r.reviewed_by).filter(Boolean)
    ])];

    // Fetch modules data
    const { data: modules } = await supabase
      .from('core_modules')
      .select('*')
      .in('module_id', moduleIds);

    // Fetch user profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', userIds);

    // Combine the data
    const enrichedRequests = requests.map(request => ({
      ...request,
      module: modules?.find(m => m.module_id === request.module_id),
      requester: profiles?.find(p => p.id === request.requested_by),
      reviewer: profiles?.find(p => p.id === request.reviewed_by)
    }));

    return { success: true, data: enrichedRequests as ModuleApprovalRequest[] };
  } catch (e: any) {
    console.error('Unexpected error in getOrganizationApprovalRequests:', e);
    return { success: false, error: e.message || 'An unexpected error occurred' };
  }
}

/**
 * Approve a module request
 */
export async function approveModuleRequest(
  requestId: string,
  reviewNotes?: string,
  autoStartProvisioning = true,
  notifyRequester = true
): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createSupabaseServerClient();

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Update the request status
    const { error: updateError } = await supabase
      .from('module_approval_requests')
      .update({
        status: 'APPROVED',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error approving request:', updateError);
      return { success: false, error: updateError.message };
    }

    // TODO: Implement provisioning logic
    if (autoStartProvisioning) {
      console.debug('Starting automatic provisioning for request:', requestId);
    }

    // TODO: Implement notification logic
    if (notifyRequester) {
      console.debug('Sending notification to requester for request:', requestId);
    }

    // Revalidate relevant paths
    revalidatePath('/admin/organizations');
    revalidatePath('/admin/modules');

    return { success: true };
  } catch (e: any) {
    console.error('Unexpected error in approveModuleRequest:', e);
    return { success: false, error: e.message || 'An unexpected error occurred' };
  }
}

/**
 * Deny a module request
 */
export async function denyModuleRequest(
  requestId: string,
  reviewNotes: string,
  notifyRequester = true
): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createSupabaseServerClient();

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Update the request status
    const { error: updateError } = await supabase
      .from('module_approval_requests')
      .update({
        status: 'DENIED',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error denying request:', updateError);
      return { success: false, error: updateError.message };
    }

    // TODO: Implement notification logic
    if (notifyRequester) {
      console.debug('Sending denial notification to requester for request:', requestId);
    }

    // Revalidate relevant paths
    revalidatePath('/admin/organizations');
    revalidatePath('/admin/modules');

    return { success: true };
  } catch (e: any) {
    console.error('Unexpected error in denyModuleRequest:', e);
    return { success: false, error: e.message || 'An unexpected error occurred' };
  }
}

/**
 * Create a new module request
 */
export async function createModuleRequest(
  organizationId: string,
  moduleId: string,
  requestReason?: string,
  metadata?: Record<string, any>
): Promise<{
  success: boolean;
  data?: ModuleApprovalRequest;
  error?: string;
}> {
  const supabase = await createSupabaseServerClient();

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Check if there's already a pending request
    const { data: existingRequest } = await supabase
      .from('module_approval_requests')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('module_id', moduleId)
      .eq('status', 'PENDING')
      .single();

    if (existingRequest) {
      return { success: false, error: 'Already has a pending request for this module' };
    }

    // Create the new request
    const { data, error } = await supabase
      .from('module_approval_requests')
      .insert({
        organization_id: organizationId,
        module_id: moduleId,
        requested_by: user.id,
        request_reason: requestReason,
        request_metadata: metadata,
        status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating module request:', error);
      return { success: false, error: error.message };
    }

    // Revalidate relevant paths
    revalidatePath('/admin/organizations');
    revalidatePath('/admin/modules');

    return { success: true, data: data as ModuleApprovalRequest };
  } catch (e: any) {
    console.error('Unexpected error in createModuleRequest:', e);
    return { success: false, error: e.message || 'An unexpected error occurred' };
  }
}

/**
 * Update module policies
 */
export async function updateModulePolicies(
  moduleId: string,
  policies: Partial<ModulePolicy>
): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createSupabaseServerClient();

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Update module policies in core_modules table
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (policies.visibility !== undefined) {
      updateData.default_visibility = policies.visibility;
    }

    if (policies.request_policy !== undefined) {
      updateData.requires_approval = policies.request_policy === 'MANUAL_APPROVAL';
    }

    const { error: updateError } = await supabase
      .from('core_modules')
      .update(updateData)
      .eq('id', moduleId);

    if (updateError) {
      console.error('Error updating module policies:', updateError);
      return { success: false, error: updateError.message };
    }

    // TODO: Create a separate module_policies table for more granular control
    // For now, we're using the existing core_modules fields

    // Revalidate relevant paths
    revalidatePath('/admin/modules');
    revalidatePath(`/admin/modules/${moduleId}`);

    return { success: true };
  } catch (e: any) {
    console.error('Unexpected error in updateModulePolicies:', e);
    return { success: false, error: e.message || 'An unexpected error occurred' };
  }
}

/**
 * Get module policies
 */
export async function getModulePolicies(moduleId: string): Promise<{
  success: boolean;
  data?: ModulePolicy;
  error?: string;
}> {
  const supabase = await createSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from('core_modules')
      .select('id, default_visibility, requires_approval, updated_at')
      .eq('id', moduleId)
      .single();

    if (error) {
      console.error('Error fetching module policies:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Module not found' };
    }

    // Map core_modules data to policy format
    const policies: ModulePolicy = {
      module_id: moduleId,
      visibility: data.default_visibility as ModulePolicy['visibility'] || 'PUBLIC',
      request_policy: data.requires_approval ? 'MANUAL_APPROVAL' : 'AUTO_APPROVE',
      auto_enable_policy: 'NONE', // TODO: Add this field to core_modules or separate table
      updated_by: '', // TODO: Add this field
      updated_at: data.updated_at || new Date().toISOString()
    };

    return { success: true, data: policies };
  } catch (e: any) {
    console.error('Unexpected error in getModulePolicies:', e);
    return { success: false, error: e.message || 'An unexpected error occurred' };
  }
}

/**
 * Get approval statistics
 */
export async function getApprovalStats(): Promise<{
  success: boolean;
  data?: {
    totalPending: number;
    approvalRate: number;
    averageTimeHours: number;
    trend: 'up' | 'down' | 'stable';
  };
  error?: string;
}> {
  const supabase = await createSupabaseServerClient();

  try {
    // Get pending count
    const { count: pendingCount, error: pendingError } = await supabase
      .from('module_approval_requests')
      .select('id', { count: 'exact' })
      .eq('status', 'PENDING');

    if (pendingError) {
      console.error('Error fetching pending count:', pendingError);
      return { success: false, error: pendingError.message };
    }

    // Get approval stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentRequests, error: statsError } = await supabase
      .from('module_approval_requests')
      .select('status, created_at, reviewed_at')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (statsError) {
      console.error('Error fetching stats:', statsError);
      return { success: false, error: statsError.message };
    }

    // Calculate approval rate
    const totalReviewed = recentRequests?.filter(r => r.status === 'APPROVED' || r.status === 'DENIED').length || 0;
    const approved = recentRequests?.filter(r => r.status === 'APPROVED').length || 0;
    const approvalRate = totalReviewed > 0 ? (approved / totalReviewed) * 100 : 0;

    // Calculate average time (simplified - in hours)
    const reviewedRequests = recentRequests?.filter(r => r.reviewed_at) || [];
    const totalHours = reviewedRequests.reduce((sum, req) => {
      const created = new Date(req.created_at);
      const reviewed = new Date(req.reviewed_at);
      const hours = (reviewed.getTime() - created.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);
    const averageTimeHours = reviewedRequests.length > 0 ? totalHours / reviewedRequests.length : 0;

    // Simple trend calculation (compare with previous period)
    // TODO: Implement more sophisticated trend analysis
    const trend: 'up' | 'down' | 'stable' = 'stable';

    return {
      success: true,
      data: {
        totalPending: pendingCount || 0,
        approvalRate: Math.round(approvalRate * 10) / 10,
        averageTimeHours: Math.round(averageTimeHours * 10) / 10,
        trend
      }
    };
  } catch (e: any) {
    console.error('Unexpected error in getApprovalStats:', e);
    return { success: false, error: e.message || 'An unexpected error occurred' };
  }
}