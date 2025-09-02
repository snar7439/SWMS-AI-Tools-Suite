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
    name: 'Opco 001',
    icon: '🔴',
    description: 'Jackson',
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
    name: 'Opco 002',
    icon: '🔴',
    description: 'Atlanta-Primary',
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
    name: 'Opco 003',
    icon: '🔴',
    description: 'Jacksonville',
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
    name: 'Opco 005',
    icon: '🔴',
    description: 'Intermountain',
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
  },
  {
    id: 'lx006',
    name: 'Opco 006',
    icon: '🔴',
    description: 'North Texas',
    region: 'na',
    priority: 'primary',
    envId: '006',
    endpoint: 'https://lx006.na.sysco.net',
    database: 'swmsdb006.na.sysco.net:1521/swm1',
    host: 'lx006.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx009',
    name: 'Opco 009',
    icon: '🔴',
    description: 'Pittsburgh',
    region: 'na',
    priority: 'primary',
    envId: '009',
    endpoint: 'https://lx009.na.sysco.net',
    database: 'swmsdb009.na.sysco.net:1521/swm1',
    host: 'lx009.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx011',
    name: 'Opco 011',
    icon: '🔴',
    description: 'Louisville',
    region: 'na',
    priority: 'primary',
    envId: '011',
    endpoint: 'https://lx011.na.sysco.net',
    database: 'swmsdb011.na.sysco.net:1521/swm1',
    host: 'lx011.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx025',
    name: 'Opco 025',
    icon: '🔴',
    description: 'Albany',
    region: 'na',
    priority: 'primary',
    envId: '025',
    endpoint: 'https://lx025.na.sysco.net',
    database: 'swmsdb025.na.sysco.net:1521/swm1',
    host: 'lx025.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },  
  {
    id: 'lx027',
    name: 'Opco 027',
    icon: '🔴',
    description: 'Syracuse',
    region: 'na',
    priority: 'primary',
    envId: '027',
    endpoint: 'https://lx027.na.sysco.net',
    database: 'swmsdb027.na.sysco.net:1521/swm1',
    host: 'lx027.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx040',
    name: 'Opco 040',
    icon: '🔴',
    description: 'Idaho',
    region: 'na',
    priority: 'primary',
    envId: '040',
    endpoint: 'https://lx040.na.sysco.net',
    database: 'swmsdb040.na.sysco.net:1521/swm1',
    host: 'lx040.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx052',
    name: 'Opco 052',
    icon: '🔴',
    description: 'Portland',
    region: 'na',
    priority: 'primary',
    envId: '052',
    endpoint: 'https://lx052.na.sysco.net',
    database: 'swmsdb052.na.sysco.net:1521/swm1',
    host: 'lx052.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx054',
    name: 'Opco 054',
    icon: '🔴',
    description: 'Connecticut',
    region: 'na',
    priority: 'primary',
    envId: '054',
    endpoint: 'https://lx054.na.sysco.net',
    database: 'swmsdb054.na.sysco.net:1521/swm1',
    host: 'lx054.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },  
  {
    id: 'lx056',
    name: 'Opco 056',
    icon: '🔴',
    description: 'Boston',
    region: 'na',
    priority: 'primary',
    envId: '056',
    endpoint: 'https://lx056.na.sysco.net',
    database: 'swmsdb056.na.sysco.net:1521/swm1',
    host: 'lx056.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx064',
    name: 'Opco 064',
    icon: '🔴',
    description: 'St. Louis',
    region: 'na',
    priority: 'primary',
    envId: '064',
    endpoint: 'https://lx064.na.sysco.net',
    database: 'swmsdb064.na.sysco.net:1521/swm1',
    host: 'lx064.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx067',
    name: 'Opco 067',
    icon: '🔴',
    description: 'Houston',
    region: 'na',
    priority: 'primary',
    envId: '067',
    endpoint: 'https://lx067.na.sysco.net',
    database: 'swmsdb067.na.sysco.net:1521/swm1',
    host: 'lx067.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx102',
    name: 'Opco 102',
    icon: '🔴',
    description: 'Spokane',
    region: 'na',
    priority: 'primary',
    envId: '102',
    endpoint: 'https://lx102.na.sysco.net',
    database: 'swmsdb102.na.sysco.net:1521/swm1',
    host: 'lx102.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx288',
    name: 'Opco 288',
    icon: '🔴',
    description: 'Knoxville',
    region: 'na',
    priority: 'primary',
    envId: '288',
    endpoint: 'https://lx288.na.sysco.net',
    database: 'swmsdb288.na.sysco.net:1521/swm1',
    host: 'lx288.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx344',
    name: 'Opco 344',
    icon: '🔴',
    description: 'IFG-Jacksonville',
    region: 'na',
    priority: 'primary',
    envId: '344',
    endpoint: 'https://lx344.na.sysco.net',
    database: 'swmsdb344.na.sysco.net:1521/swm1',
    host: 'lx344.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx442',
    name: 'Opco 442',
    icon: '🔴',
    description: 'Ottawa',
    region: 'na',
    priority: 'primary',
    envId: '442',
    endpoint: 'https://lx442.na.sysco.net',
    database: 'swmsdb442.na.sysco.net:1521/swm1',
    host: 'lx442.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx901',
    name: 'Opco 901',
    icon: '🔴',
    description: 'Harlow',
    region: 'na',
    priority: 'primary',
    envId: '901',
    endpoint: 'https://lx901.na.sysco.net',
    database: 'swmsdb901.na.sysco.net:1521/swm1',
    host: 'lx901.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
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
