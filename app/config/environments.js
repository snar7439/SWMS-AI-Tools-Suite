/**
 * Environment Configuration Manager
 * 
 * This file provides a unified interface to access all environment configurations.
 * It imports from separate production and development environment files.
 */

import { 
  getProductionEnvironments, 
  getProductionEnvironmentById,
  getProductionEnvironmentsByRegion,
  getProductionEnvironmentsByPriority
} from './production-environments.js';

import { 
  getDevelopmentEnvironments, 
  getDevelopmentEnvironmentById,
  getDevelopmentEnvironmentsByType,
  getDevelopmentEnvironmentsByStability,
  getStableDevelopmentEnvironments
} from './development-environments.js';

/**
 * Environment types
 */
export const ENVIRONMENT_TYPES = {
  PRODUCTION: 'production',
  DEVELOPMENT: 'development'
};

/**
 * Get environments by type
 * @param {string} type - Environment type ('production' or 'development')
 * @returns {Array} Array of environment objects
 */
export const getEnvironmentsByType = (type) => {
  switch (type) {
    case ENVIRONMENT_TYPES.PRODUCTION:
      return getProductionEnvironments();
    case ENVIRONMENT_TYPES.DEVELOPMENT:
      return getDevelopmentEnvironments();
    default:
      return [];
  }
};

/**
 * Get all environments (both production and development)
 * @returns {Object} Object with production and development environment arrays
 */
export const getAllEnvironments = () => {
  return {
    production: getProductionEnvironments(),
    development: getDevelopmentEnvironments()
  };
};

/**
 * Get a specific environment by ID from any type
 * @param {string} id - Environment ID
 * @returns {Object|null} Environment object or null if not found
 */
export const getEnvironmentById = (id) => {
  const prodEnv = getProductionEnvironmentById(id);
  if (prodEnv) return { ...prodEnv, type: ENVIRONMENT_TYPES.PRODUCTION };
  
  const devEnv = getDevelopmentEnvironmentById(id);
  if (devEnv) return { ...devEnv, type: ENVIRONMENT_TYPES.DEVELOPMENT };
  
  return null;
};

/**
 * Search environments by name (case-insensitive)
 * @param {string} searchTerm - Search term
 * @returns {Array} Array of matching environments
 */
export const searchEnvironmentsByName = (searchTerm) => {
  const allEnvs = getAllEnvironments();
  const searchLower = searchTerm.toLowerCase();
  
  const matchingEnvs = [];
  
  // Search production environments
  allEnvs.production.forEach(env => {
    if (env.name.toLowerCase().includes(searchLower)) {
      matchingEnvs.push({ ...env, type: ENVIRONMENT_TYPES.PRODUCTION });
    }
  });
  
  // Search development environments
  allEnvs.development.forEach(env => {
    if (env.name.toLowerCase().includes(searchLower)) {
      matchingEnvs.push({ ...env, type: ENVIRONMENT_TYPES.DEVELOPMENT });
    }
  });
  
  return matchingEnvs;
};

/**
 * Validate environment configuration
 * @param {Object} environment - Environment object to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export const validateEnvironment = (environment) => {
  const errors = [];
  
  if (!environment.id) errors.push('Environment ID is required');
  if (!environment.name) errors.push('Environment name is required');
  if (!environment.icon) errors.push('Environment icon is required');
  if (!environment.description) errors.push('Environment description is required');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Re-export specific functions for convenience
export {
  // Production environment functions
  getProductionEnvironments,
  getProductionEnvironmentById,
  getProductionEnvironmentsByRegion,
  getProductionEnvironmentsByPriority,
  
  // Development environment functions
  getDevelopmentEnvironments,
  getDevelopmentEnvironmentById,
  getDevelopmentEnvironmentsByType,
  getDevelopmentEnvironmentsByStability,
  getStableDevelopmentEnvironments
};
