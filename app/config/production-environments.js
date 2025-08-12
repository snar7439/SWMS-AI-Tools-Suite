/**
 * Production Environment Configurations
 * 
 * This file contains all production environment definitions.
 * Each environment should have:
 * - id: unique identifier
 * - name: display name
 * - icon: emoji icon for UI
 * - description: brief description of the environment
 * - region: geographical region (optional)
 * - endpoint: API endpoint (optional)
 * - priority: deployment priority (optional)
 */

const productionEnvironments = [
  {
    id: 'lx001',
    name: 'Production 001',
    icon: '🔴',
    description: 'Production environment 001',
    region: 'na',
    priority: 'primary',
    envId: '001',
    endpoint: 'https://lx001.na.sysco.net',
    database: 'swmsdb001.na.sysco.net:1521/swm1',
    host: 'lx001.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx002',
    name: 'Production 002',
    icon: '🔴',
    description: 'Production environment 002',
    region: 'na',
    priority: 'primary',
    envId: '002',
    endpoint: 'https://lx002.na.sysco.net',
    database: 'swmsdb002.na.sysco.net:1521/swm1',
    host: 'lx002.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx003',
    name: 'Production 003',
    icon: '🔴',
    description: 'Production environment 003',
    region: 'na',
    priority: 'primary',
    envId: '003',
    endpoint: 'https://lx003.na.sysco.net',
    database: 'swmsdb003.na.sysco.net:1521/swm1',
    host: 'lx003.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx005',
    name: 'Production 005',
    icon: '🔴',
    description: 'Production environment 005',
    region: 'na',
    priority: 'primary',
    envId: '005',
    endpoint: 'https://lx005.na.sysco.net',
    database: 'swmsdb005.na.sysco.net:1521/swm1',
    host: 'lx005.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  }
];

/**
 * Get all production environments
 * @returns {Array} Array of production environment objects
 */
export const getProductionEnvironments = () => {
  return productionEnvironments;
};

/**
 * Get a specific production environment by ID
 * @param {string} id - Environment ID
 * @returns {Object|null} Environment object or null if not found
 */
export const getProductionEnvironmentById = (id) => {
  return productionEnvironments.find(env => env.id === id) || null;
};

/**
 * Get production environments by region
 * @param {string} region - Region identifier
 * @returns {Array} Array of environments in the specified region
 */
export const getProductionEnvironmentsByRegion = (region) => {
  return productionEnvironments.filter(env => env.region === region);
};

/**
 * Get production environments by priority
 * @param {string} priority - Priority level (primary, secondary, regional)
 * @returns {Array} Array of environments with the specified priority
 */
export const getProductionEnvironmentsByPriority = (priority) => {
  return productionEnvironments.filter(env => env.priority === priority);
};

export default productionEnvironments;
