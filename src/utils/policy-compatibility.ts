import { EnhancedPolicyTools } from '../tools/policy.enhanced.js';
import { PolicyTools } from '../tools/policy.js';

// ============================================================================
// BACKWARDS COMPATIBILITY LAYER
// ============================================================================

/**
 * Migration strategy for existing policy tools
 * 
 * This module provides a compatibility layer that:
 * 1. Preserves existing API contracts
 * 2. Adds feature flags for gradual migration
 * 3. Provides fallback mechanisms
 * 4. Logs migration warnings
 */

export interface CompatibilityOptions {
  useEnhancedTools?: boolean;
  logMigrationWarnings?: boolean;
  strictCompatibility?: boolean;
}

const defaultOptions: CompatibilityOptions = {
  useEnhancedTools: true,
  logMigrationWarnings: true,
  strictCompatibility: false
};

/**
 * Logs migration warnings for legacy usage
 */
function logMigrationWarning(method: string, suggestion: string) {
  if (defaultOptions.logMigrationWarnings) {
    console.warn(`[MIGRATION WARNING] ${method} is using legacy format. Consider: ${suggestion}`);
  }
}

/**
 * Wraps legacy policy tools with enhanced functionality
 */
export class CompatibilityPolicyTools {
  private options: CompatibilityOptions;

  constructor(options: CompatibilityOptions = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  /**
   * Lists policy rules with backwards compatibility
   */
  async listRules(params: any = {}) {
    if (this.options.useEnhancedTools) {
      logMigrationWarning('listRules', 'Use EnhancedPolicyTools.listRules with format parameter');
      
      try {
        // Try enhanced tools first
        return await EnhancedPolicyTools.listRules.handler({
          ...params,
          format: 'legacy'
        });
      } catch (error) {
        console.warn('Enhanced tools failed, falling back to legacy:', error);
        
        if (this.options.strictCompatibility) {
          throw error;
        }
        
        // Fallback to original tools
        return await PolicyTools.listPolicyRules.handler(params);
      }
    } else {
      // Use original tools
      return await PolicyTools.listPolicyRules.handler(params);
    }
  }

  /**
   * Gets a specific policy rule with backwards compatibility
   */
  async getRule(params: { id: number; fields?: string }) {
    if (this.options.useEnhancedTools) {
      logMigrationWarning('getRule', 'Use EnhancedPolicyTools.getRule with format parameter');
      
      try {
        return await EnhancedPolicyTools.getRule.handler({
          id: String(params.id),
          fields: params.fields,
          format: 'legacy'
        });
      } catch (error) {
        console.warn('Enhanced tools failed, falling back to legacy:', error);
        
        if (this.options.strictCompatibility) {
          throw error;
        }
        
        return await PolicyTools.getPolicyRule.handler(params);
      }
    } else {
      return await PolicyTools.getPolicyRule.handler(params);
    }
  }

  /**
   * Creates a policy rule with backwards compatibility
   */
  async createRule(params: any) {
    if (this.options.useEnhancedTools) {
      logMigrationWarning('createRule', 'Use EnhancedPolicyTools.createRule with simplified parameters');
      
      try {
        return await EnhancedPolicyTools.createRule.handler(params);
      } catch (error) {
        console.warn('Enhanced tools failed, falling back to legacy:', error);
        
        if (this.options.strictCompatibility) {
          throw error;
        }
        
        return await PolicyTools.createPolicyRule.handler(params);
      }
    } else {
      return await PolicyTools.createPolicyRule.handler(params);
    }
  }

  /**
   * Updates a policy rule with backwards compatibility
   */
  async updateRule(params: any) {
    if (this.options.useEnhancedTools) {
      logMigrationWarning('updateRule', 'Use EnhancedPolicyTools.updateRule with simplified parameters');
      
      try {
        return await EnhancedPolicyTools.updateRule.handler(params);
      } catch (error) {
        console.warn('Enhanced tools failed, falling back to legacy:', error);
        
        if (this.options.strictCompatibility) {
          throw error;
        }
        
        return await PolicyTools.updatePolicyRule.handler(params);
      }
    } else {
      return await PolicyTools.updatePolicyRule.handler(params);
    }
  }

  /**
   * Deletes a policy rule with backwards compatibility
   */
  async deleteRule(params: { id: number }) {
    if (this.options.useEnhancedTools) {
      logMigrationWarning('deleteRule', 'Use EnhancedPolicyTools.deleteRule');
      
      try {
        return await EnhancedPolicyTools.deleteRule.handler({ id: String(params.id) });
      } catch (error) {
        console.warn('Enhanced tools failed, falling back to legacy:', error);
        
        if (this.options.strictCompatibility) {
          throw error;
        }
        
        return await PolicyTools.deletePolicyRule.handler(params);
      }
    } else {
      return await PolicyTools.deletePolicyRule.handler(params);
    }
  }
}

/**
 * Default compatibility instance
 */
export const compatibilityPolicyTools = new CompatibilityPolicyTools();

// ============================================================================
// FEATURE FLAGS AND CONFIGURATION
// ============================================================================

/**
 * Feature flags for controlling migration behavior
 */
export interface PolicyFeatureFlags {
  useNetskopeSchema: boolean;
  enableTransformations: boolean;
  allowLegacyFallback: boolean;
  logSchemaValidation: boolean;
  enableRawFormat: boolean;
  enableNormalizedFormat: boolean;
  enableLegacyFormat: boolean;
}

export const defaultFeatureFlags: PolicyFeatureFlags = {
  useNetskopeSchema: true,
  enableTransformations: true,
  allowLegacyFallback: true,
  logSchemaValidation: true,
  enableRawFormat: true,
  enableNormalizedFormat: true,
  enableLegacyFormat: true
};

/**
 * Configuration manager for policy tools
 */
export class PolicyConfiguration {
  private flags: PolicyFeatureFlags;

  constructor(flags: Partial<PolicyFeatureFlags> = {}) {
    this.flags = { ...defaultFeatureFlags, ...flags };
  }

  /**
   * Gets current feature flags
   */
  getFlags(): PolicyFeatureFlags {
    return { ...this.flags };
  }

  /**
   * Updates feature flags
   */
  setFlags(flags: Partial<PolicyFeatureFlags>) {
    this.flags = { ...this.flags, ...flags };
  }

  /**
   * Checks if a feature is enabled
   */
  isEnabled(feature: keyof PolicyFeatureFlags): boolean {
    return this.flags[feature];
  }

  /**
   * Enables a feature
   */
  enable(feature: keyof PolicyFeatureFlags) {
    this.flags[feature] = true;
  }

  /**
   * Disables a feature
   */
  disable(feature: keyof PolicyFeatureFlags) {
    this.flags[feature] = false;
  }

  /**
   * Resets to default configuration
   */
  reset() {
    this.flags = { ...defaultFeatureFlags };
  }
}

/**
 * Default configuration instance
 */
export const policyConfiguration = new PolicyConfiguration();

// ============================================================================
// MIGRATION UTILITIES
// ============================================================================

/**
 * Validates if current setup supports enhanced features
 */
export function validateEnhancedSupport(): {
  supported: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check if enhanced schemas are available
  try {
    require('../types/schemas/policy.schemas.netskope.js');
  } catch (error) {
    issues.push('Enhanced schemas not available');
    recommendations.push('Ensure policy.schemas.netskope.ts is compiled');
  }

  // Check if transformers are available
  try {
    require('../utils/policy-transformers.js');
  } catch (error) {
    issues.push('Policy transformers not available');
    recommendations.push('Ensure policy-transformers.ts is compiled');
  }

  // Check if enhanced tools are available
  try {
    require('../tools/policy.enhanced.js');
  } catch (error) {
    issues.push('Enhanced tools not available');
    recommendations.push('Ensure policy.enhanced.ts is compiled');
  }

  return {
    supported: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * Generates migration report
 */
export function generateMigrationReport(): {
  status: 'ready' | 'partial' | 'not-ready';
  details: {
    enhancedSupport: boolean;
    compatibilityLayer: boolean;
    featureFlags: PolicyFeatureFlags;
    issues: string[];
    recommendations: string[];
  };
} {
  const validation = validateEnhancedSupport();
  
  return {
    status: validation.supported ? 'ready' : (validation.issues.length > 0 ? 'partial' : 'not-ready'),
    details: {
      enhancedSupport: validation.supported,
      compatibilityLayer: true,
      featureFlags: policyConfiguration.getFlags(),
      issues: validation.issues,
      recommendations: validation.recommendations
    }
  };
}