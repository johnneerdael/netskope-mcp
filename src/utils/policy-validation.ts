import { ZodError, ZodSchema } from 'zod';
import {
  netskopeRawPolicyResponseSchema,
  netskopeRawPolicyRuleSchema,
  netskopeNormalizedPolicyRuleSchema,
  NetskopeRawPolicyRule,
  NetskopeNormalizedPolicyRule
} from '../types/schemas/policy.schemas.netskope.js';
import { SCIMTools } from '../tools/scim.js';
import { PrivateAppsTools } from '../tools/private-apps.js';

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  error?: ValidationError;
  warnings?: string[];
}

export interface ValidationError {
  type: 'schema' | 'business' | 'api' | 'transformation';
  message: string;
  details?: any;
  path?: string[];
  suggestions?: string[];
}

export interface ValidationContext {
  strict?: boolean;
  allowPartial?: boolean;
  skipUnknownFields?: boolean;
  transformOnValidation?: boolean;
  validateBusinessRules?: boolean;
}

// ============================================================================
// SCHEMA VALIDATION UTILITIES
// ============================================================================

/**
 * Validates data against a Zod schema with enhanced error handling
 */
export function validateWithSchema<T>(
  schema: ZodSchema<T>,
  data: any,
  context: ValidationContext = {}
): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    
    return {
      success: true,
      data: result,
      warnings: []
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: {
          type: 'schema',
          message: 'Schema validation failed',
          details: error.errors,
          path: error.errors[0]?.path?.map(String),
          suggestions: generateSchemaSuggestions(error.errors)
        }
      };
    }

    return {
      success: false,
      error: {
        type: 'schema',
        message: error instanceof Error ? error.message : 'Unknown validation error',
        details: error
      }
    };
  }
}

/**
 * Generates helpful suggestions from Zod validation errors
 */
function generateSchemaSuggestions(errors: any[]): string[] {
  const suggestions: string[] = [];
  
  for (const error of errors) {
    switch (error.code) {
      case 'invalid_type':
        suggestions.push(`Expected ${error.expected} but got ${error.received} at path: ${error.path?.join('.')}`);
        break;
      case 'unrecognized_keys':
        suggestions.push(`Remove unexpected keys: ${error.keys.join(', ')}`);
        break;
      case 'invalid_union':
        suggestions.push(`Value doesn't match any of the expected formats at path: ${error.path?.join('.')}`);
        break;
      case 'too_small':
        suggestions.push(`Value is too small. Minimum: ${error.minimum} at path: ${error.path?.join('.')}`);
        break;
      case 'too_big':
        suggestions.push(`Value is too big. Maximum: ${error.maximum} at path: ${error.path?.join('.')}`);
        break;
      case 'invalid_enum_value':
        suggestions.push(`Invalid enum value. Expected one of: ${error.options.join(', ')}`);
        break;
      default:
        suggestions.push(`Validation error: ${error.message}`);
    }
  }
  
  return suggestions;
}

// ============================================================================
// NETSKOPE-SPECIFIC VALIDATION
// ============================================================================

/**
 * Validates raw Netskope policy response
 */
export function validateRawPolicyResponse(data: any, context: ValidationContext = {}): ValidationResult<any> {
  const warnings: string[] = [];
  
  // Basic structure validation
  if (!data || typeof data !== 'object') {
    return {
      success: false,
      error: {
        type: 'schema',
        message: 'Response must be an object',
        suggestions: ['Ensure the API response is a valid JSON object']
      }
    };
  }

  // Check for data array
  if (!Array.isArray(data.data)) {
    return {
      success: false,
      error: {
        type: 'schema',
        message: 'Response must contain a data array',
        suggestions: ['Check if the API endpoint returned the expected format']
      }
    };
  }

  // Validate with schema (use safeParse to avoid transformation issues)
  try {
    const parsed = netskopeRawPolicyResponseSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          type: 'schema',
          message: 'Schema validation failed',
          details: parsed.error.errors,
          suggestions: generateSchemaSuggestions(parsed.error.errors)
        }
      };
    }

    // Business rule validation
    if (context.validateBusinessRules) {
      const businessValidation = validateBusinessRules(parsed.data);
      if (!businessValidation.success) {
        return businessValidation;
      }
      warnings.push(...(businessValidation.warnings || []));
    }

    return {
      success: true,
      data: parsed.data,
      warnings
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'schema',
        message: 'Schema validation error',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestions: ['Check the data format and schema compatibility']
      }
    };
  }
}

/**
 * Validates individual policy rule
 */
export function validatePolicyRule(rule: any, context: ValidationContext = {}): ValidationResult<NetskopeRawPolicyRule> {
  const warnings: string[] = [];

  // Basic validation
  if (!rule || typeof rule !== 'object') {
    return {
      success: false,
      error: {
        type: 'schema',
        message: 'Rule must be an object',
        suggestions: ['Ensure the rule data is a valid JSON object']
      }
    };
  }

  // Required fields check
  const requiredFields = ['rule_id', 'rule_name', 'enabled', 'rule_data'];
  for (const field of requiredFields) {
    if (!(field in rule)) {
      return {
        success: false,
        error: {
          type: 'schema',
          message: `Missing required field: ${field}`,
          suggestions: [`Ensure the rule object contains the '${field}' field`]
        }
      };
    }
  }

  // Validate enabled field format
  if (rule.enabled !== "0" && rule.enabled !== "1") {
    warnings.push(`Enabled field should be "0" or "1", got: ${rule.enabled}`);
  }

  // Validate rule_data structure
  if (!rule.rule_data || typeof rule.rule_data !== 'object') {
    return {
      success: false,
      error: {
        type: 'schema',
        message: 'rule_data must be an object',
        suggestions: ['Ensure rule_data contains the policy configuration']
      }
    };
  }

  // Schema validation (use safeParse to avoid transformation issues)
  try {
    const parsed = netskopeRawPolicyRuleSchema.safeParse(rule);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          type: 'schema',
          message: 'Rule schema validation failed',
          details: parsed.error.errors,
          suggestions: generateSchemaSuggestions(parsed.error.errors)
        }
      };
    }

    // Business rule validation
    if (context.validateBusinessRules) {
      const businessValidation = validateRuleBusinessLogic(parsed.data);
      if (!businessValidation.success) {
        return businessValidation;
      }
      warnings.push(...(businessValidation.warnings || []));
    }

    return {
      success: true,
      data: parsed.data,
      warnings
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'schema',
        message: 'Rule validation error',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestions: ['Check the rule data format and schema compatibility']
      }
    };
  }
}

/**
 * Validates normalized policy rule
 */
export function validateNormalizedRule(rule: any, context: ValidationContext = {}): ValidationResult<NetskopeNormalizedPolicyRule> {
  try {
    const parsed = netskopeNormalizedPolicyRuleSchema.safeParse(rule);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          type: 'schema',
          message: 'Normalized rule schema validation failed',
          details: parsed.error.errors,
          suggestions: generateSchemaSuggestions(parsed.error.errors)
        }
      };
    }

    return {
      success: true,
      data: parsed.data,
      warnings: []
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'schema',
        message: 'Normalized rule validation error',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestions: ['Check the normalized rule data format']
      }
    };
  }
}

// ============================================================================
// BUSINESS RULE VALIDATION
// ============================================================================

/**
 * Validates business rules for policy response
 */
function validateBusinessRules(response: any): ValidationResult {
  const warnings: string[] = [];
  
  // Check for empty response
  if (!response.data || response.data.length === 0) {
    warnings.push('No policy rules found in response');
  }

  // Check for duplicate rule IDs
  const ruleIds = new Set<string>();
  const duplicates: string[] = [];
  
  for (const rule of response.data) {
    if (ruleIds.has(rule.rule_id)) {
      duplicates.push(rule.rule_id);
    }
    ruleIds.add(rule.rule_id);
  }

  if (duplicates.length > 0) {
    return {
      success: false,
      error: {
        type: 'business',
        message: 'Duplicate rule IDs found',
        details: { duplicates },
        suggestions: ['Check for data consistency issues in the API response']
      }
    };
  }

  return {
    success: true,
    warnings
  };
}

/**
 * Validates business logic for individual rule
 */
function validateRuleBusinessLogic(rule: NetskopeRawPolicyRule): ValidationResult {
  const warnings: string[] = [];

  // Check for empty rule name
  if (!rule.rule_name.trim()) {
    warnings.push('Rule name is empty');
  }

  // Check for rules without conditions
  const hasConditions = 
    rule.rule_data.privateApps?.length > 0 ||
    (rule.rule_data.users?.length ?? 0) > 0 ||
    (rule.rule_data.userGroups?.length ?? 0) > 0 ||
    (rule.rule_data.privateAppTags?.length ?? 0) > 0;

  if (!hasConditions) {
    warnings.push('Rule has no conditions defined (may apply to all users/apps)');
  }

  // Check for potentially dangerous configurations
  if (rule.rule_data.match_criteria_action?.action_name === 'block' && !hasConditions) {
    return {
      success: false,
      error: {
        type: 'business',
        message: 'Block rule without conditions would block all access',
        suggestions: ['Add specific conditions to limit the scope of the block rule']
      }
    };
  }

  // Check for DLP configuration consistency
  if (rule.rule_data.dlp_profile && rule.rule_data.dlp_profile.length > 0) {
    if (!rule.rule_data.dlp_actions || rule.rule_data.dlp_actions.length === 0) {
      warnings.push('DLP profiles defined but no DLP actions configured');
    }
  }

  return {
    success: true,
    warnings
  };
}

// ============================================================================
// TRANSFORMATION VALIDATION
// ============================================================================

/**
 * Validates data before transformation
 */
export function validatePreTransformation(data: any, sourceFormat: string, targetFormat: string): ValidationResult {
  const warnings: string[] = [];

  // Format-specific validation
  switch (sourceFormat) {
    case 'raw':
      return validateRawPolicyResponse(data, { validateBusinessRules: true });
    case 'normalized':
      if (Array.isArray(data)) {
        for (const item of data) {
          const result = validateNormalizedRule(item);
          if (!result.success) {
            return result;
          }
        }
      }
      break;
    default:
      warnings.push(`Unknown source format: ${sourceFormat}`);
  }

  return {
    success: true,
    warnings
  };
}

/**
 * Validates data after transformation
 */
export function validatePostTransformation(data: any, targetFormat: string, originalData?: any): ValidationResult {
  const warnings: string[] = [];

  // Validate target format
  switch (targetFormat) {
    case 'normalized':
      if (Array.isArray(data)) {
        for (const item of data) {
          const result = validateNormalizedRule(item);
          if (!result.success) {
            return result;
          }
        }
      }
      break;
    case 'legacy':
      // Legacy format validation would go here
      break;
    default:
      warnings.push(`Unknown target format: ${targetFormat}`);
  }

  // Data integrity checks
  if (originalData && Array.isArray(originalData.data) && Array.isArray(data)) {
    if (originalData.data.length !== data.length) {
      warnings.push('Data count mismatch after transformation');
    }
  }

  return {
    success: true,
    warnings
  };
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Creates a standardized error response
 */
export function createValidationError(
  type: ValidationError['type'],
  message: string,
  details?: any,
  suggestions?: string[]
): ValidationError {
  return {
    type,
    message,
    details,
    suggestions
  };
}

/**
 * Formats validation errors for user display
 */
export function formatValidationError(error: ValidationError): string {
  let message = `[${error.type.toUpperCase()}] ${error.message}`;
  
  if (error.path && error.path.length > 0) {
    message += ` at path: ${error.path.join('.')}`;
  }
  
  if (error.suggestions && error.suggestions.length > 0) {
    message += '\nSuggestions:\n' + error.suggestions.map(s => `  - ${s}`).join('\n');
  }
  
  return message;
}

/**
 * Safely validates and transforms data with comprehensive error handling
 */
export async function safeValidateAndTransform<T>(
  data: any,
  validator: (data: any) => ValidationResult<T>,
  transformer?: (data: T) => any,
  context: ValidationContext = {}
): Promise<ValidationResult<any>> {
  try {
    // Validate input
    const validationResult = validator(data);
    if (!validationResult.success) {
      return validationResult;
    }

    // Transform if transformer provided
    if (transformer && validationResult.data) {
      const transformedData = transformer(validationResult.data);
      
      return {
        success: true,
        data: transformedData,
        warnings: validationResult.warnings
      };
    }

    return validationResult;
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'api',
        message: 'Unexpected error during validation/transformation',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestions: ['Check the input data format and try again']
      }
    };
  }
}

// ============================================================================
// RESOURCE VALIDATION AND RESOLUTION
// ============================================================================

/**
 * Validates and resolves user groups to their display names
 */
export async function validateAndResolveUserGroups(groupNames: string[]): Promise<string[]> {
  const resolvedGroups: string[] = [];
  
  for (const groupName of groupNames) {
    try {
      // Check if it looks like a UUID (if so, we need to resolve it to display name)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(groupName);
      
      if (isUUID) {
        // This is a UUID, get all groups and find the display name
        const allGroupsResult = await SCIMTools.listGroups.handler({});
        const allGroupsResponse = JSON.parse(allGroupsResult.content[0].text);
        
        if (allGroupsResponse.Resources) {
          const matchingGroup = allGroupsResponse.Resources.find((group: any) => 
            group.id === groupName || group.externalId === groupName
          );
          
          if (matchingGroup) {
            resolvedGroups.push(matchingGroup.displayName);
            continue;
          } else {
            throw new Error(`Group with ID '${groupName}' not found. Available groups: ${
              allGroupsResponse.Resources.map((g: any) => `${g.displayName} (${g.id})`).join(', ')
            }`);
          }
        }
      } else {
        // This is a display name, try to search by display name
        const result = await SCIMTools.searchGroups.handler({
          displayName: groupName
        });
        
        const response = JSON.parse(result.content[0].text);
        
        if (response.Resources && response.Resources.length > 0) {
          // Found exact match
          resolvedGroups.push(response.Resources[0].displayName);
        } else {
          // Try to find partial matches by listing all groups
          const allGroupsResult = await SCIMTools.listGroups.handler({});
          const allGroupsResponse = JSON.parse(allGroupsResult.content[0].text);
          
          if (allGroupsResponse.Resources) {
            const partialMatches = allGroupsResponse.Resources.filter((group: any) =>
              group.displayName.toLowerCase().includes(groupName.toLowerCase())
            );
            
            if (partialMatches.length > 0) {
              // Use the first partial match
              resolvedGroups.push(partialMatches[0].displayName);
            } else {
              throw new Error(`Group '${groupName}' not found. Available groups: ${
                allGroupsResponse.Resources.map((g: any) => g.displayName).join(', ')
              }`);
            }
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to validate group '${groupName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return resolvedGroups;
}

/**
 * Validates and resolves private app names to their IDs
 */
export async function validateAndResolvePrivateApps(appNames: string[]): Promise<string[]> {
  const resolvedAppIds: string[] = [];
  
  for (const appName of appNames) {
    try {
      // Search for the app by name
      const result = await PrivateAppsTools.list.handler({
        query: appName
      });
      
      const response = JSON.parse(result.content[0].text);
      
      if (response.data && response.data.private_apps) {
        const matchingApp = response.data.private_apps.find((app: any) => 
          app.app_name === appName || app.app_name === `[${appName}]`
        );
        
        if (matchingApp) {
          resolvedAppIds.push(matchingApp.app_id.toString());
        } else {
          throw new Error(`Private app '${appName}' not found. Available apps: ${
            response.data.private_apps.map((app: any) => app.app_name).join(', ')
          }`);
        }
      } else {
        throw new Error(`No private apps found or API error: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      throw new Error(`Failed to validate private app '${appName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return resolvedAppIds;
}

/**
 * Validates private app names exist and returns the correct display names
 */
export async function validatePrivateAppNames(appNames: string[]): Promise<string[]> {
  const validatedAppNames: string[] = [];
  
  for (const appName of appNames) {
    try {
      // Search for the app by name
      const result = await PrivateAppsTools.list.handler({
        query: appName
      });
      
      const response = JSON.parse(result.content[0].text);
      
      if (response.data && response.data.private_apps) {
        const matchingApp = response.data.private_apps.find((app: any) => 
          app.app_name === appName || app.app_name === `[${appName}]`
        );
        
        if (matchingApp) {
          // Use the exact app name format from the API response
          const cleanAppName = matchingApp.app_name.startsWith('[') && matchingApp.app_name.endsWith(']') 
            ? matchingApp.app_name.slice(1, -1) // Remove brackets
            : matchingApp.app_name;
          validatedAppNames.push(cleanAppName);
        } else {
          throw new Error(`Private app '${appName}' not found. Available apps: ${
            response.data.private_apps.map((app: any) => app.app_name).join(', ')
          }`);
        }
      } else {
        throw new Error(`No private apps found or API error: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      throw new Error(`Failed to validate private app '${appName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return validatedAppNames;
}

/**
 * Enhanced policy rule creation with validation
 */
export async function createPolicyRuleWithValidation(params: {
  name: string;
  description?: string;
  enabled?: boolean;
  action?: 'allow' | 'block';
  policy_group_id: number | string;
  private_app_names?: string[];
  user_groups?: string[];
  access_methods?: ('Client' | 'Clientless')[];
  priority?: 'top' | 'bottom';
}) {
  const validatedParams = { ...params };
  
  // Validate and resolve user groups
  if (params.user_groups && params.user_groups.length > 0) {
    try {
      validatedParams.user_groups = await validateAndResolveUserGroups(params.user_groups);
      console.log(`Resolved user groups: ${validatedParams.user_groups.join(', ')}`);
    } catch (error) {
      throw new Error(`User group validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Validate private app names exist (but keep as names, don't convert to IDs)
  if (params.private_app_names && params.private_app_names.length > 0) {
    try {
      // Just validate that the apps exist, but keep the names
      const validatedAppNames = await validatePrivateAppNames(params.private_app_names);
      validatedParams.private_app_names = validatedAppNames;
      console.log(`Validated private app names: ${validatedAppNames.join(', ')}`);
    } catch (error) {
      throw new Error(`Private app validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return validatedParams;
}