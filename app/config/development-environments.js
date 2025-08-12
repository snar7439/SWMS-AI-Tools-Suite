/**
 * Development Environment Configurations
 * 
 * This file contains all development and testing environment definitions.
 * Each environment should have:
 * - id: unique identifier
 * - name: display name
 * - icon: emoji icon for UI
 * - description: brief description of the environment
 * - type: environment type (development, staging, testing, etc.)
 * - endpoint: API endpoint (optional)
 * - stability: environment stability level (optional)
 */

const developmentEnvironments = [
  {
    id: 'lx739q21',
    name: 'Development 739q21',
    icon: '🟢',
    description: 'Development environment 739q21',
    type: 'development',
    stability: 'stable',
    envId: '739q21',
    endpoint: 'https://lx739q21-swms-frontend-layer.swms-np.us-east-1.aws.sysco.net/',
    database: 'lx739q21-db.swms-np.us-east-1.aws.sysco.net:1521/swm1',
    host: 'lx739q21-app.swms-np.us-east-1.aws.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },  
  {
    id: 'lx739q50',
    name: 'Development 739q50',
    icon: '🟢',
    description: 'Development environment 739q50',
    type: 'development',
    stability: 'stable',
    envId: '739q50',
    endpoint: 'https://lx739q50-swms-frontend-layer.swms-np.us-east-1.aws.sysco.net/',
    database: 'lx739q50-db.swms-np.us-east-1.aws.sysco.net:1521/swm1',
    host: 'lx739q50-app.swms-np.us-east-1.aws.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx739q60',
    name: 'Development 739q60',
    icon: '🟢',
    description: 'Development environment 739q60',
    type: 'development',
    stability: 'stable',
    envId: '739q60',
    endpoint: 'https://lx739q60-swms-frontend-layer.swms-np.us-east-1.aws.sysco.net/',
    database: 'lx739q60-db.swms-np.us-east-1.aws.sysco.net:1521/swm1',
    host: 'lx739q60-app.swms-np.us-east-1.aws.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx739q70',
    name: 'Development 739q70',
    icon: '🟢',
    description: 'Development environment 739q70',
    type: 'development',
    stability: 'stable',
    envId: '739q70',
    endpoint: 'https://lx739q70-swms-frontend-layer.swms-np.us-east-1.aws.sysco.net/',
    database: 'lx739q70-db.swms-np.us-east-1.aws.sysco.net:1521/swm1',
    host: 'lx739q70-app.swms-np.us-east-1.aws.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  }
];

/**
 * Get all development environments
 * @returns {Array} Array of development environment objects
 */
export const getDevelopmentEnvironments = () => {
  return developmentEnvironments;
};

/**
 * Get a specific development environment by ID
 * @param {string} id - Environment ID
 * @returns {Object|null} Environment object or null if not found
 */
export const getDevelopmentEnvironmentById = (id) => {
  return developmentEnvironments.find(env => env.id === id) || null;
};

/**
 * Get development environments by type
 * @param {string} type - Environment type (development, staging, testing, experimental)
 * @returns {Array} Array of environments of the specified type
 */
export const getDevelopmentEnvironmentsByType = (type) => {
  return developmentEnvironments.filter(env => env.type === type);
};

/**
 * Get development environments by stability level
 * @param {string} stability - Stability level (stable, moderate, unstable)
 * @returns {Array} Array of environments with the specified stability level
 */
export const getDevelopmentEnvironmentsByStability = (stability) => {
  return developmentEnvironments.filter(env => env.stability === stability);
};

/**
 * Get only stable development environments
 * @returns {Array} Array of stable development environments
 */
export const getStableDevelopmentEnvironments = () => {
  return developmentEnvironments.filter(env => env.stability === 'stable');
};

export default developmentEnvironments;
