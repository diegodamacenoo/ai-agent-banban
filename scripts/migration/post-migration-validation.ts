#!/usr/bin/env tsx

/**
 * Post-Migration Validation Script
 * 
 * Validates that the dynamic module system is working correctly after migration
 * and provides detailed reporting on system health.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface ValidationResult {
  category: string;
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

class PostMigrationValidator {
  private results: ValidationResult[] = [];

  async runValidation() {
    console.log('🔍 Post-Migration Validation Report');
    console.log('===================================\n');

    await this.validateDatabaseIntegrity();
    await this.validateModuleConfiguration();
    await this.validateFileSystem();
    await this.validateDynamicLoading();
    await this.validateNavigationGeneration();
    
    this.generateReport();
  }

  private addResult(category: string, test: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any) {
    this.results.push({ category, test, status, message, details });
  }

  private async validateDatabaseIntegrity() {
    console.log('📊 Validating Database Integrity...\n');

    // Test 1: Core tables exist and have data
    try {
      const { data: modules, error: modulesError } = await supabase
        .from('core_modules')
        .select('id, slug, name')
        .limit(10);

      if (modulesError) throw modulesError;

      this.addResult(
        'Database',
        'Core Modules Table',
        modules && modules.length > 0 ? 'pass' : 'fail',
        `Found ${modules?.length || 0} core modules`,
        modules
      );

    } catch (error) {
      this.addResult('Database', 'Core Modules Table', 'fail', `Error: ${error.message}`);
    }

    // Test 2: Module implementations exist
    try {
      const { data: implementations, error } = await supabase
        .from('module_implementations')
        .select('id, client_type, component_path')
        .limit(10);

      if (error) throw error;

      this.addResult(
        'Database',
        'Module Implementations',
        implementations && implementations.length > 0 ? 'pass' : 'fail',
        `Found ${implementations?.length || 0} implementations`,
        implementations
      );

    } catch (error) {
      this.addResult('Database', 'Module Implementations', 'fail', `Error: ${error.message}`);
    }

    // Test 3: Navigation configuration exists
    try {
      const { data: navigation, error } = await supabase
        .from('module_navigation')
        .select('id, nav_title, route_path')
        .limit(10);

      if (error) throw error;

      this.addResult(
        'Database',
        'Module Navigation',
        navigation && navigation.length > 0 ? 'pass' : 'fail',
        `Found ${navigation?.length || 0} navigation entries`
      );

    } catch (error) {
      this.addResult('Database', 'Module Navigation', 'fail', `Error: ${error.message}`);
    }

    // Test 4: Tenant modules are configured
    try {
      const { data: tenantModules, error } = await supabase
        .from('tenant_modules')
        .select('id, organization_id')
        .eq('is_visible', true)
        .eq('operational_status', 'ENABLED')
        .limit(10);

      if (error) throw error;

      this.addResult(
        'Database',
        'Tenant Modules',
        tenantModules && tenantModules.length > 0 ? 'pass' : 'warning',
        `Found ${tenantModules?.length || 0} active tenant modules`
      );

    } catch (error) {
      this.addResult('Database', 'Tenant Modules', 'fail', `Error: ${error.message}`);
    }
  }

  private async validateModuleConfiguration() {
    console.log('⚙️  Validating Module Configuration...\n');

    // Test 1: Complete module configuration query
    try {
      const { data: completeModules, error } = await supabase
        .from('tenant_modules')
        .select(`
          *,
          core_modules (
            slug,
            name,
            description,
            category
          ),
          module_implementations (
            component_path,
            name,
            icon_name,
            permissions,
            config
          ),
          module_navigation (
            nav_type,
            nav_title,
            nav_order,
            route_path
          )
        `)
        .eq('is_visible', true)
        .eq('operational_status', 'ENABLED')
        .limit(5);

      if (error) throw error;

      const hasCompleteData = completeModules?.every(module => 
        module.core_modules && 
        module.module_implementations && 
        module.module_navigation
      );

      this.addResult(
        'Configuration',
        'Complete Module Data',
        hasCompleteData ? 'pass' : 'fail',
        `${completeModules?.length || 0} modules have complete configuration`,
        completeModules
      );

    } catch (error) {
      this.addResult('Configuration', 'Complete Module Data', 'fail', `Error: ${error.message}`);
    }

    // Test 2: Client type coverage
    try {
      const { data: clientTypes, error } = await supabase
        .from('module_implementations')
        .select('client_type')
        .neq('client_type', null);

      if (error) throw error;

      const uniqueClientTypes = [...new Set(clientTypes?.map(ct => ct.client_type))];

      this.addResult(
        'Configuration',
        'Client Type Coverage',
        uniqueClientTypes.length > 0 ? 'pass' : 'fail',
        `Supporting ${uniqueClientTypes.length} client types: ${uniqueClientTypes.join(', ')}`
      );

    } catch (error) {
      this.addResult('Configuration', 'Client Type Coverage', 'fail', `Error: ${error.message}`);
    }
  }

  private async validateFileSystem() {
    console.log('📁 Validating File System...\n');

    // Test 1: Dynamic system files exist
    const requiredFiles = [
      'src/core/modules/registry/DynamicModuleRegistry.ts',
      'src/shared/components/DynamicSidebar.tsx',
      'src/shared/components/DynamicLayout.tsx',
      'src/app/(protected)/[slug]/[...path]/page.tsx'
    ];

    for (const file of requiredFiles) {
      try {
        await fs.access(file);
        this.addResult('File System', `Required File: ${path.basename(file)}`, 'pass', `File exists: ${file}`);
      } catch {
        this.addResult('File System', `Required File: ${path.basename(file)}`, 'fail', `Missing file: ${file}`);
      }
    }

    // Test 2: Legacy files are removed
    const legacyFiles = [
      'src/shared/utils/module-component-registry.ts',
      'src/shared/components/unified-sidebar.tsx',
      'src/core/modules/banban/index.ts'
    ];

    for (const file of legacyFiles) {
      try {
        await fs.access(file);
        this.addResult('File System', `Legacy File: ${path.basename(file)}`, 'warning', `Legacy file still exists: ${file}`);
      } catch {
        this.addResult('File System', `Legacy File: ${path.basename(file)}`, 'pass', `Legacy file removed: ${file}`);
      }
    }
  }

  private async validateDynamicLoading() {
    console.log('🔄 Validating Dynamic Loading...\n');

    // Test 1: Module implementations have valid component paths
    try {
      const { data: implementations, error } = await supabase
        .from('module_implementations')
        .select('component_path, client_type')
        .eq('is_available', true);

      if (error) throw error;

      let validPaths = 0;
      let invalidPaths = 0;

      for (const impl of implementations || []) {
        if (impl.component_path && impl.component_path.startsWith('@/')) {
          validPaths++;
        } else {
          invalidPaths++;
        }
      }

      this.addResult(
        'Dynamic Loading',
        'Component Path Validation',
        invalidPaths === 0 ? 'pass' : 'warning',
        `${validPaths} valid paths, ${invalidPaths} invalid paths`
      );

    } catch (error) {
      this.addResult('Dynamic Loading', 'Component Path Validation', 'fail', `Error: ${error.message}`);
    }
  }

  private async validateNavigationGeneration() {
    console.log('🧭 Validating Navigation Generation...\n');

    // Test 1: Navigation entries have proper structure
    try {
      const { data: navigation, error } = await supabase
        .from('module_navigation')
        .select('nav_title, route_path, nav_order')
        .order('nav_order');

      if (error) throw error;

      const hasValidNavigation = navigation?.every(nav => 
        nav.nav_title && 
        nav.nav_title.length > 0 &&
        nav.route_path
      );

      this.addResult(
        'Navigation',
        'Navigation Structure',
        hasValidNavigation ? 'pass' : 'fail',
        `${navigation?.length || 0} navigation entries validated`
      );

    } catch (error) {
      this.addResult('Navigation', 'Navigation Structure', 'fail', `Error: ${error.message}`);
    }

    // Test 2: Route paths are unique and valid
    try {
      const { data: routes, error } = await supabase
        .from('module_navigation')
        .select('route_path')
        .not('route_path', 'is', null);

      if (error) throw error;

      const routePaths = routes?.map(r => r.route_path) || [];
      const uniqueRoutes = new Set(routePaths);

      this.addResult(
        'Navigation',
        'Route Uniqueness',
        routePaths.length === uniqueRoutes.size ? 'pass' : 'warning',
        `${routePaths.length} routes, ${uniqueRoutes.size} unique`
      );

    } catch (error) {
      this.addResult('Navigation', 'Route Uniqueness', 'fail', `Error: ${error.message}`);
    }
  }

  private generateReport() {
    console.log('\n📋 Validation Summary');
    console.log('====================\n');

    const categories = [...new Set(this.results.map(r => r.category))];
    
    for (const category of categories) {
      console.log(`📂 ${category}`);
      const categoryResults = this.results.filter(r => r.category === category);
      
      for (const result of categoryResults) {
        const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
        console.log(`  ${icon} ${result.test}: ${result.message}`);
      }
      console.log('');
    }

    // Overall statistics
    const passCount = this.results.filter(r => r.status === 'pass').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    const failCount = this.results.filter(r => r.status === 'fail').length;
    const total = this.results.length;

    console.log('📊 Overall Results');
    console.log('==================');
    console.log(`✅ Passed: ${passCount}/${total} (${((passCount/total)*100).toFixed(1)}%)`);
    console.log(`⚠️  Warnings: ${warningCount}/${total} (${((warningCount/total)*100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failCount}/${total} (${((failCount/total)*100).toFixed(1)}%)`);

    if (failCount === 0) {
      console.log('\n🎉 Migration validation successful! The dynamic module system is fully operational.');
    } else if (failCount < 3) {
      console.log('\n⚠️  Migration mostly successful with minor issues. Review failed tests above.');
    } else {
      console.log('\n❌ Migration validation failed. Critical issues found that need attention.');
    }

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'logs', `migration-validation-${Date.now()}.json`);
    fs.writeFile(reportPath, JSON.stringify(this.results, null, 2))
      .then(() => console.log(`\n📄 Detailed report saved to: ${reportPath}`))
      .catch(err => console.log(`⚠️  Could not save report: ${err.message}`));
  }
}

// Main execution
if (require.main === module) {
  const validator = new PostMigrationValidator();
  validator.runValidation().catch(console.error);
}

export default PostMigrationValidator;