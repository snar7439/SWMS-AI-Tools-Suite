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
    id: 'lx004',
    name: 'Opco 004',
    icon: '🔴',
    description: 'Modesto',
    region: 'na',
    priority: 'primary',
    envId: '004',
    endpoint: 'https://lx004.na.sysco.net',
    database: 'swmsdb004.na.sysco.net:1521/swm1',
    host: 'lx004.na.sysco.net',
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
    id: 'lx007',
    name: 'Opco 007',
    icon: '🔴',
    description: 'Virginia',
    region: 'na',
    priority: 'primary',
    envId: '007',
    endpoint: 'https://lx007.na.sysco.net',
    database: 'swmsdb007.na.sysco.net:1521/swm1',
    host: 'lx007.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx008',
    name: 'Opco 008',
    icon: '🔴',
    description: 'North New England',
    region: 'na',
    priority: 'primary',
    envId: '008',
    endpoint: 'https://lx008.na.sysco.net',
    database: 'swmsdb008.na.sysco.net:1521/swm1',
    host: 'lx008.na.sysco.net',
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
    id: 'lx010',
    name: 'Opco 010',
    icon: '🔴',
    description: 'Eastern Maryland',
    region: 'na',
    priority: 'primary',
    envId: '010',
    endpoint: 'https://lx010.na.sysco.net',
    database: 'swmsdb010.na.sysco.net:1521/swm1',
    host: 'lx010.na.sysco.net',
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
    id: 'lx012',
    name: 'Opco 012',
    icon: '🔴',
    description: 'Baltimore',
    region: 'na',
    priority: 'primary',
    envId: '012',
    endpoint: 'https://lx012.na.sysco.net',
    database: 'swmsdb012.na.sysco.net:1521/swm1',
    host: 'lx012.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx013',
    name: 'Opco 013',
    icon: '🔴',
    description: 'Central Texas',
    region: 'na',
    priority: 'primary',
    envId: '013',
    endpoint: 'https://lx013.na.sysco.net',
    database: 'swmsdb013.na.sysco.net:1521/swm1',
    host: 'lx013.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx014',
    name: 'Opco 014',
    icon: '🔴',
    description: 'Memphis',
    region: 'na',
    priority: 'primary',
    envId: '014',
    endpoint: 'https://lx014.na.sysco.net',
    database: 'swmsdb014.na.sysco.net:1521/swm1',
    host: 'lx014.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx015',
    name: 'Opco 015',
    icon: '🔴',
    description: 'Cleveland',
    region: 'na',
    priority: 'primary',
    envId: '015',
    endpoint: 'https://lx015.na.sysco.net',
    database: 'swmsdb015.na.sysco.net:1521/swm1',
    host: 'lx015.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx016',
    name: 'Opco 016',
    icon: '🔴',
    description: 'South Florida',
    region: 'na',
    priority: 'primary',
    envId: '016',
    endpoint: 'https://lx016.na.sysco.net',
    database: 'swmsdb016.na.sysco.net:1521/swm1',
    host: 'lx016.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx017',
    name: 'Opco 017',
    icon: '🔴',
    description: 'Las Vegas',
    region: 'na',
    priority: 'primary',
    envId: '017',
    endpoint: 'https://lx017.na.sysco.net',
    database: 'swmsdb017.na.sysco.net:1521/swm1',
    host: 'lx017.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx018',
    name: 'Opco 018',
    icon: '🔴',
    description: 'Baraboo',
    region: 'na',
    priority: 'primary',
    envId: '018',
    endpoint: 'https://lx018.na.sysco.net',
    database: 'swmsdb018.na.sysco.net:1521/swm1',
    host: 'lx018.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx019',
    name: 'Opco 019',
    icon: '🔴',
    description: 'Cincinnati',
    region: 'na',
    priority: 'primary',
    envId: '019',
    endpoint: 'https://lx019.na.sysco.net',
    database: 'swmsdb019.na.sysco.net:1521/swm1',
    host: 'lx019.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx022',
    name: 'Opco 022',
    icon: '🔴',
    description: 'Central Florida',
    region: 'na',
    priority: 'primary',
    envId: '022',
    endpoint: 'https://lx022.na.sysco.net',
    database: 'swmsdb022.na.sysco.net:1521/swm1',
    host: 'lx022.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx023',
    name: 'Opco 023',
    icon: '🔴',
    description: 'New Orleans',
    region: 'na',
    priority: 'primary',
    envId: '023',
    endpoint: 'https://lx023.na.sysco.net',
    database: 'swmsdb023.na.sysco.net:1521/swm1',
    host: 'lx023.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx024',
    name: 'Opco 024',
    icon: '🔴',
    description: 'Chicago',
    region: 'na',
    priority: 'primary',
    envId: '024',
    endpoint: 'https://lx024.na.sysco.net',
    database: 'swmsdb024.na.sysco.net:1521/swm1',
    host: 'lx024.na.sysco.net',
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
    id: 'lx026',
    name: 'Opco 026',
    icon: '🔴',
    description: 'Oklahoma',
    region: 'na',
    priority: 'primary',
    envId: '026',
    endpoint: 'https://lx026.na.sysco.net',
    database: 'swmsdb026.na.sysco.net:1521/swm1',
    host: 'lx026.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx029',
    name: 'Opco 029',
    icon: '🔴',
    description: 'Arkansas',
    region: 'na',
    priority: 'primary',
    envId: '029',
    endpoint: 'https://lx029.na.sysco.net',
    database: 'swmsdb029.na.sysco.net:1521/swm1',
    host: 'lx029.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx031',
    name: 'Opco 031',
    icon: '🔴',
    description: 'Sacramento',
    region: 'na',
    priority: 'primary',
    envId: '031',
    endpoint: 'https://lx031.na.sysco.net',
    database: 'swmsdb031.na.sysco.net:1521/swm1',
    host: 'lx031.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx032',
    name: 'Opco 032',
    icon: '🔴',
    description: 'Southeast Florida',
    region: 'na',
    priority: 'primary',
    envId: '032',
    endpoint: 'https://lx032.na.sysco.net',
    database: 'swmsdb032.na.sysco.net:1521/swm1',
    host: 'lx032.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx035',
    name: 'Opco 035',
    icon: '🔴',
    description: 'East Wisconsin',
    region: 'na',
    priority: 'primary',
    envId: '035',
    endpoint: 'https://lx035.na.sysco.net',
    database: 'swmsdb035.na.sysco.net:1521/swm1',
    host: 'lx035.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx036',
    name: 'Opco 036',
    icon: '🔴',
    description: 'San Diego',
    region: 'na',
    priority: 'primary',
    envId: '036',
    endpoint: 'https://lx036.na.sysco.net',
    database: 'swmsdb036.na.sysco.net:1521/swm1',
    host: 'lx036.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx037',
    name: 'Opco 037',
    icon: '🔴',
    description: 'West Coast Florida',
    region: 'na',
    priority: 'primary',
    envId: '037',
    endpoint: 'https://lx037.na.sysco.net',
    database: 'swmsdb037.na.sysco.net:1521/swm1',
    host: 'lx037.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx038',
    name: 'Opco 038',
    icon: '🔴',
    description: 'Indianapolis',
    region: 'na',
    priority: 'primary',
    envId: '038',
    endpoint: 'https://lx038.na.sysco.net',
    database: 'swmsdb038.na.sysco.net:1521/swm1',
    host: 'lx038.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx039',
    name: 'Opco 039',
    icon: '🔴',
    description: 'Iowa',
    region: 'na',
    priority: 'primary',
    envId: '039',
    endpoint: 'https://lx039.na.sysco.net',
    database: 'swmsdb039.na.sysco.net:1521/swm1',
    host: 'lx039.na.sysco.net',
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
    id: 'lx042',
    name: 'Opco 042',
    icon: '🔴',
    description: 'Central WHSE',
    region: 'na',
    priority: 'primary',
    envId: '042',
    endpoint: 'https://lx042.na.sysco.net',
    database: 'swmsdb042.na.sysco.net:1521/swm1',
    host: 'lx042.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx043',
    name: 'Opco 043',
    icon: '🔴',
    description: 'Montana',
    region: 'na',
    priority: 'primary',
    envId: '043',
    endpoint: 'https://lx043.na.sysco.net',
    database: 'swmsdb043.na.sysco.net:1521/swm1',
    host: 'lx043.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx044',
    name: 'Opco 044',
    icon: '🔴',
    description: 'Vancouver',
    region: 'na',
    priority: 'primary',
    envId: '044',
    endpoint: 'https://lx044.na.sysco.net',
    database: 'swmsdb044.na.sysco.net:1521/swm1',
    host: 'lx044.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx045',
    name: 'Opco 045',
    icon: '🔴',
    description: 'Los Angeles',
    region: 'na',
    priority: 'primary',
    envId: '045',
    endpoint: 'https://lx045.na.sysco.net',
    database: 'swmsdb045.na.sysco.net:1521/swm1',
    host: 'lx045.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx046',
    name: 'Opco 046',
    icon: '🔴',
    description: 'Central Alabama',
    region: 'na',
    priority: 'primary',
    envId: '046',
    endpoint: 'https://lx046.na.sysco.net',
    database: 'swmsdb046.na.sysco.net:1521/swm1',
    host: 'lx046.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx047',
    name: 'Opco 047',
    icon: '🔴',
    description: 'Minnesota',
    region: 'na',
    priority: 'primary',
    envId: '047',
    endpoint: 'https://lx047.na.sysco.net',
    database: 'swmsdb047.na.sysco.net:1521/swm1',
    host: 'lx047.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx048',
    name: 'Opco 048',
    icon: '🔴',
    description: 'Charlotte',
    region: 'na',
    priority: 'primary',
    envId: '048',
    endpoint: 'https://lx048.na.sysco.net',
    database: 'swmsdb048.na.sysco.net:1521/swm1',
    host: 'lx048.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx049',
    name: 'Opco 049',
    icon: '🔴',
    description: 'Arizona',
    region: 'na',
    priority: 'primary',
    envId: '049',
    endpoint: 'https://lx049.na.sysco.net',
    database: 'swmsdb049.na.sysco.net:1521/swm1',
    host: 'lx049.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx050',
    name: 'Opco 050',
    icon: '🔴',
    description: 'San Francisco',
    region: 'na',
    priority: 'primary',
    envId: '050',
    endpoint: 'https://lx050.na.sysco.net',
    database: 'swmsdb050.na.sysco.net:1521/swm1',
    host: 'lx050.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx051',
    name: 'Opco 051',
    icon: '🔴',
    description: 'Central PA',
    region: 'na',
    priority: 'primary',
    envId: '051',
    endpoint: 'https://lx051.na.sysco.net',
    database: 'swmsdb051.na.sysco.net:1521/swm1',
    host: 'lx051.na.sysco.net',
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
    id: 'lx055',
    name: 'Opco 055',
    icon: '🔴',
    description: 'Seattle',
    region: 'na',
    priority: 'primary',
    envId: '055',
    endpoint: 'https://lx055.na.sysco.net',
    database: 'swmsdb055.na.sysco.net:1521/swm1',
    host: 'lx055.na.sysco.net',
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
    id: 'lx057',
    name: 'Opco 057',
    icon: '🔴',
    description: 'Kansas City',
    region: 'na',
    priority: 'primary',
    envId: '057',
    endpoint: 'https://lx057.na.sysco.net',
    database: 'swmsdb057.na.sysco.net:1521/swm1',
    host: 'lx057.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx058',
    name: 'Opco 058',
    icon: '🔴',
    description: 'Detroit',
    region: 'na',
    priority: 'primary',
    envId: '058',
    endpoint: 'https://lx058.na.sysco.net',
    database: 'swmsdb058.na.sysco.net:1521/swm1',
    host: 'lx058.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx059',
    name: 'Opco 059',
    icon: '🔴',
    description: 'Denver',
    region: 'na',
    priority: 'primary',
    envId: '059',
    endpoint: 'https://lx059.na.sysco.net',
    database: 'swmsdb059.na.sysco.net:1521/swm1',
    host: 'lx059.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx060',
    name: 'Opco 060',
    icon: '🔴',
    description: 'Nashville',
    region: 'na',
    priority: 'primary',
    envId: '060',
    endpoint: 'https://lx060.na.sysco.net',
    database: 'swmsdb060.na.sysco.net:1521/swm1',
    host: 'lx060.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx061',
    name: 'Opco 061',
    icon: '🔴',
    description: 'Lincoln',
    region: 'na',
    priority: 'primary',
    envId: '061',
    endpoint: 'https://lx061.na.sysco.net',
    database: 'swmsdb061.na.sysco.net:1521/swm1',
    host: 'lx061.na.sysco.net',
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
    id: 'lx066',
    name: 'Opco 066',
    icon: '🔴',
    description: 'New Mexico',
    region: 'na',
    priority: 'primary',
    envId: '066',
    endpoint: 'https://lx066.na.sysco.net',
    database: 'swmsdb066.na.sysco.net:1521/swm1',
    host: 'lx066.na.sysco.net',
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
    id: 'lx068',
    name: 'Opco 068',
    icon: '🔴',
    description: 'Grand Rapids',
    region: 'na',
    priority: 'primary',
    envId: '068',
    endpoint: 'https://lx068.na.sysco.net',
    database: 'swmsdb068.na.sysco.net:1521/swm1',
    host: 'lx068.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx073',
    name: 'Opco 073',
    icon: '🔴',
    description: 'Hampton Roads',
    region: 'na',
    priority: 'primary',
    envId: '073',
    endpoint: 'https://lx073.na.sysco.net',
    database: 'swmsdb073.na.sysco.net:1521/swm1',
    host: 'lx073.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx075',
    name: 'Opco 075',
    icon: '🔴',
    description: 'Philadelphia',
    region: 'na',
    priority: 'primary',
    envId: '075',
    endpoint: 'https://lx075.na.sysco.net',
    database: 'swmsdb075.na.sysco.net:1521/swm1',
    host: 'lx075.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx076',
    name: 'Opco 076',
    icon: '🔴',
    description: 'Metro NY',
    region: 'na',
    priority: 'primary',
    envId: '076',
    endpoint: 'https://lx076.na.sysco.net',
    database: 'swmsdb076.na.sysco.net:1521/swm1',
    host: 'lx076.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx077',
    name: 'Opco 077',
    icon: '🔴',
    description: 'Central Ontario',
    region: 'na',
    priority: 'primary',
    envId: '077',
    endpoint: 'https://lx077.na.sysco.net',
    database: 'swmsdb077.na.sysco.net:1521/swm1',
    host: 'lx077.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx078',
    name: 'Opco 078',
    icon: '🔴',
    description: 'West Texas',
    region: 'na',
    priority: 'primary',
    envId: '078',
    endpoint: 'https://lx078.na.sysco.net',
    database: 'swmsdb078.na.sysco.net:1521/swm1',
    host: 'lx078.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx101',
    name: 'Opco 101',
    icon: '🔴',
    description: 'Ventura',
    region: 'na',
    priority: 'primary',
    envId: '101',
    endpoint: 'https://lx101.na.sysco.net',
    database: 'swmsdb101.na.sysco.net:1521/swm1',
    host: 'lx101.na.sysco.net',
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
    id: 'lx103',
    name: 'Opco 103',
    icon: '🔴',
    description: 'Asian Foods',
    region: 'na',
    priority: 'primary',
    envId: '103',
    endpoint: 'https://lx103.na.sysco.net',
    database: 'swmsdb103.na.sysco.net:1521/swm1',
    host: 'lx103.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx134',
    name: 'Opco 134',
    icon: '🔴',
    description: 'IFG',
    region: 'na',
    priority: 'primary',
    envId: '134',
    endpoint: 'https://lx134.na.sysco.net',
    database: 'swmsdb134.na.sysco.net:1521/swm1',
    host: 'lx134.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx137',
    name: 'Opco 137',
    icon: '🔴',
    description: 'Colombia',
    region: 'na',
    priority: 'primary',
    envId: '137',
    endpoint: 'https://lx137.na.sysco.net',
    database: 'swmsdb137.na.sysco.net:1521/swm1',
    host: 'lx137.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx139',
    name: 'Opco 139',
    icon: '🔴',
    description: 'Victoria',
    region: 'na',
    priority: 'primary',
    envId: '139',
    endpoint: 'https://lx139.na.sysco.net',
    database: 'swmsdb139.na.sysco.net:1521/swm1',
    host: 'lx139.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx146',
    name: 'Opco 146',
    icon: '🔴',
    description: 'Central WHSE West',
    region: 'na',
    priority: 'primary',
    envId: '146',
    endpoint: 'https://lx146.na.sysco.net',
    database: 'swmsdb146.na.sysco.net:1521/swm1',
    host: 'lx146.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx147',
    name: 'Opco 147',
    icon: '🔴',
    description: 'Central WHSE SE',
    region: 'na',
    priority: 'primary',
    envId: '147',
    endpoint: 'https://lx147.na.sysco.net',
    database: 'swmsdb147.na.sysco.net:1521/swm1',
    host: 'lx147.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx148',
    name: 'Opco 148',
    icon: '🔴',
    description: 'Central WHSE NE',
    region: 'na',
    priority: 'primary',
    envId: '148',
    endpoint: 'https://lx148.na.sysco.net',
    database: 'swmsdb148.na.sysco.net:1521/swm1',
    host: 'lx148.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx162',
    name: 'Opco 162',
    icon: '🔴',
    description: 'Kelowna',
    region: 'na',
    priority: 'primary',
    envId: '162',
    endpoint: 'https://lx162.na.sysco.net',
    database: 'swmsdb162.na.sysco.net:1521/swm1',
    host: 'lx162.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx163',
    name: 'Opco 163',
    icon: '🔴',
    description: 'Raleigh',
    region: 'na',
    priority: 'primary',
    envId: '163',
    endpoint: 'https://lx163.na.sysco.net',
    database: 'swmsdb163.na.sysco.net:1521/swm1',
    host: 'lx163.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx164',
    name: 'Opco 164',
    icon: '🔴',
    description: 'Gulf Coast',
    region: 'na',
    priority: 'primary',
    envId: '164',
    endpoint: 'https://lx164.na.sysco.net',
    database: 'swmsdb164.na.sysco.net:1521/swm1',
    host: 'lx164.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx177',
    name: 'Opco 177',
    icon: '🔴',
    description: 'Northeast RDC',
    region: 'na',
    priority: 'primary',
    envId: '177',
    endpoint: 'https://lx177.na.sysco.net',
    database: 'swmsdb177.na.sysco.net:1521/swm1',
    host: 'lx177.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx180',
    name: 'Opco 180',
    icon: '🔴',
    description: 'Toronto',
    region: 'na',
    priority: 'primary',
    envId: '180',
    endpoint: 'https://lx180.na.sysco.net',
    database: 'swmsdb180.na.sysco.net:1521/swm1',
    host: 'lx180.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx181',
    name: 'Opco 181',
    icon: '🔴',
    description: 'Calgary',
    region: 'na',
    priority: 'primary',
    envId: '181',
    endpoint: 'https://lx181.na.sysco.net',
    database: 'swmsdb181.na.sysco.net:1521/swm1',
    host: 'lx181.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx184',
    name: 'Opco 184',
    icon: '🔴',
    description: 'Southeast RDC',
    region: 'na',
    priority: 'primary',
    envId: '184',
    endpoint: 'https://lx184.na.sysco.net',
    database: 'swmsdb184.na.sysco.net:1521/swm1',
    host: 'lx184.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx194',
    name: 'Opco 194',
    icon: '🔴',
    description: 'Central Illinois',
    region: 'na',
    priority: 'primary',
    envId: '194',
    endpoint: 'https://lx194.na.sysco.net',
    database: 'swmsdb194.na.sysco.net:1521/swm1',
    host: 'lx194.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx195',
    name: 'Opco 195',
    icon: '🔴',
    description: 'North Dakota',
    region: 'na',
    priority: 'primary',
    envId: '195',
    endpoint: 'https://lx195.na.sysco.net',
    database: 'swmsdb195.na.sysco.net:1521/swm1',
    host: 'lx195.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx256',
    name: 'Opco 256',
    icon: '🔴',
    description: 'Milton',
    region: 'na',
    priority: 'primary',
    envId: '256',
    endpoint: 'https://lx256.na.sysco.net',
    database: 'swmsdb256.na.sysco.net:1521/swm1',
    host: 'lx256.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx257',
    name: 'Opco 257',
    icon: '🔴',
    description: 'Edmonton',
    region: 'na',
    priority: 'primary',
    envId: '257',
    endpoint: 'https://lx257.na.sysco.net',
    database: 'swmsdb257.na.sysco.net:1521/swm1',
    host: 'lx257.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx258',
    name: 'Opco 258',
    icon: '🔴',
    description: 'Regina',
    region: 'na',
    priority: 'primary',
    envId: '258',
    endpoint: 'https://lx258.na.sysco.net',
    database: 'swmsdb258.na.sysco.net:1521/swm1',
    host: 'lx258.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx259',
    name: 'Opco 259',
    icon: '🔴',
    description: 'Winnipeg',
    region: 'na',
    priority: 'primary',
    envId: '259',
    endpoint: 'https://lx259.na.sysco.net',
    database: 'swmsdb259.na.sysco.net:1521/swm1',
    host: 'lx259.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx262',
    name: 'Opco 262',
    icon: '🔴',
    description: 'Moncton',
    region: 'na',
    priority: 'primary',
    envId: '262',
    endpoint: 'https://lx262.na.sysco.net',
    database: 'swmsdb262.na.sysco.net:1521/swm1',
    host: 'lx262.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx264',
    name: 'Opco 264',
    icon: '🔴',
    description: 'St. John’s',
    region: 'na',
    priority: 'primary',
    envId: '264',
    endpoint: 'https://lx264.na.sysco.net',
    database: 'swmsdb264.na.sysco.net:1521/swm1',
    host: 'lx264.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx265',
    name: 'Opco 265',
    icon: '🔴',
    description: 'Halifax',
    region: 'na',
    priority: 'primary',
    envId: '265',
    endpoint: 'https://lx265.na.sysco.net',
    database: 'swmsdb265.na.sysco.net:1521/swm1',
    host: 'lx265.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx268',
    name: 'Opco 268',
    icon: '🔴',
    description: 'Atlantic',
    region: 'na',
    priority: 'primary',
    envId: '268',
    endpoint: 'https://lx268.na.sysco.net',
    database: 'swmsdb268.na.sysco.net:1521/swm1',
    host: 'lx268.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx274',
    name: 'Opco 274',
    icon: '🔴',
    description: 'Thunder Bay',
    region: 'na',
    priority: 'primary',
    envId: '274',
    endpoint: 'https://lx274.na.sysco.net',
    database: 'swmsdb274.na.sysco.net:1521/swm1',
    host: 'lx274.na.sysco.net',
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
    id: 'lx293',
    name: 'Opco 293',
    icon: '🔴',
    description: 'East Texas',
    region: 'na',
    priority: 'primary',
    envId: '293',
    endpoint: 'https://lx293.na.sysco.net',
    database: 'swmsdb293.na.sysco.net:1521/swm1',
    host: 'lx293.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx303',
    name: 'Opco 303',
    icon: '🔴',
    description: 'New Castle West',
    region: 'na',
    priority: 'primary',
    envId: '303',
    endpoint: 'https://lx303.na.sysco.net',
    database: 'swmsdb303.na.sysco.net:1521/swm1',
    host: 'lx303.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx306',
    name: 'Opco 306',
    icon: '🔴',
    description: 'Long Island',
    region: 'na',
    priority: 'primary',
    envId: '306',
    endpoint: 'https://lx306.na.sysco.net',
    database: 'swmsdb306.na.sysco.net:1521/swm1',
    host: 'lx306.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx320',
    name: 'Opco 320',
    icon: '🔴',
    description: 'Riverside',
    region: 'na',
    priority: 'primary',
    envId: '320',
    endpoint: 'https://lx320.na.sysco.net',
    database: 'swmsdb320.na.sysco.net:1521/swm1',
    host: 'lx320.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx331',
    name: 'Opco 331',
    icon: '🔴',
    description: 'Boucherville',
    region: 'na',
    priority: 'primary',
    envId: '331',
    endpoint: 'https://lx331.na.sysco.net',
    database: 'swmsdb331.na.sysco.net:1521/swm1',
    host: 'lx331.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx332',
    name: 'Opco 332',
    icon: '🔴',
    description: 'Western Minnesota',
    region: 'na',
    priority: 'primary',
    envId: '332',
    endpoint: 'https://lx332.na.sysco.net',
    database: 'swmsdb332.na.sysco.net:1521/swm1',
    host: 'lx332.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx335',
    name: 'Opco 335',
    icon: '🔴',
    description: 'Bahamas',
    region: 'na',
    priority: 'primary',
    envId: '335',
    endpoint: 'https://lx335.na.sysco.net',
    database: 'swmsdb335.na.sysco.net:1521/swm1',
    host: 'lx335.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx338',
    name: 'Opco 338',
    icon: '🔴',
    description: 'SW Ontario',
    region: 'na',
    priority: 'primary',
    envId: '338',
    endpoint: 'https://lx338.na.sysco.net',
    database: 'swmsdb338.na.sysco.net:1521/swm1',
    host: 'lx338.na.sysco.net',
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
    id: 'lx349',
    name: 'Opco 349',
    icon: '🔴',
    description: 'Dublin',
    region: 'na',
    priority: 'primary',
    envId: '349',
    endpoint: 'https://lx349.na.sysco.net',
    database: 'swmsdb349.na.sysco.net:1521/swm1',
    host: 'lx349.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx429',
    name: 'Opco 429',
    icon: '🔴',
    description: 'Acadiana',
    region: 'na',
    priority: 'primary',
    envId: '429',
    endpoint: 'https://lx429.na.sysco.net',
    database: 'swmsdb429.na.sysco.net:1521/swm1',
    host: 'lx429.na.sysco.net',
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
    id: 'lx450',
    name: 'Opco 450',
    icon: '🔴',
    description: 'Alaska',
    region: 'na',
    priority: 'primary',
    envId: '450',
    endpoint: 'https://lx450.na.sysco.net',
    database: 'swmsdb450.na.sysco.net:1521/swm1',
    host: 'lx450.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx499',
    name: 'Opco 499',
    icon: '🔴',
    description: 'Lisburn',
    region: 'na',
    priority: 'primary',
    envId: '499',
    endpoint: 'https://lx499.na.sysco.net',
    database: 'swmsdb499.na.sysco.net:1521/swm1',
    host: 'lx499.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx564',
    name: 'Opco 564',
    icon: '🔴',
    description: 'Cork',
    region: 'na',
    priority: 'primary',
    envId: '564',
    endpoint: 'https://lx564.na.sysco.net',
    database: 'swmsdb564.na.sysco.net:1521/swm1',
    host: 'lx564.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx629',
    name: 'Opco 629',
    icon: '🔴',
    description: 'Allentown',
    region: 'na',
    priority: 'primary',
    envId: '629',
    endpoint: 'https://lx629.na.sysco.net',
    database: 'swmsdb629.na.sysco.net:1521/swm1',
    host: 'lx629.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx653',
    name: 'Opco 653',
    icon: '🔴',
    description: 'Tampa Bay',
    region: 'na',
    priority: 'primary',
    envId: '653',
    endpoint: 'https://lx653.na.sysco.net',
    database: 'swmsdb653.na.sysco.net:1521/swm1',
    host: 'lx653.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx654',
    name: 'Opco 654',
    icon: '🔴',
    description: 'Arizona East',
    region: 'na',
    priority: 'primary',
    envId: '654',
    endpoint: 'https://lx654.na.sysco.net',
    database: 'swmsdb654.na.sysco.net:1521/swm1',
    host: 'lx654.na.sysco.net',
    sshPort: 22,
    logPaths: {
      swms: '/var/log/swms.log'
    }
  },
  {
    id: 'lx838',
    name: 'Opco 838',
    icon: '🔴',
    description: 'SW Ontario RDC',
    region: 'na',
    priority: 'primary',
    envId: '838',
    endpoint: 'https://lx838.na.sysco.net',
    database: 'swmsdb838.na.sysco.net:1521/swm1',
    host: 'lx838.na.sysco.net',
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
  {
    id: 'lx928',
    name: 'Opco 928',
    icon: '🔴',
    description: 'Hemel',
    region: 'na',
    priority: 'primary',
    envId: '928',
    endpoint: 'https://lx928.na.sysco.net',
    database: 'swmsdb928.na.sysco.net:1521/swm1',
    host: 'lx928.na.sysco.net',
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
