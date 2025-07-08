/**
 * Centralized SWMS Reports Configuration
 * 
 * Direct payload approach - payloads are sent directly from config to SWMS API
 */

export const swmsReports = [
  {
    id: 'swms-equipment',
    name: 'Equipment Overview (SWMS)',
    type: 'PDF',
    size: 'Dynamic',
    lastModified: 'Real-time',
    pdfUrl: null, // Will be fetched from SWMS
    reportPath: '/report/equipment-overview',
    payload: {"userId":"OPS$TEST0100","languageID":3,"opcoNumber":"swms","type":"PDF","equipId":null,"zoneId":null,"printerName":null,"reportValue":"me1ra"},
    content: 'Equipment overview report from SWMS showing all equipment status, locations, and operational data.',
    category: 'equipment',
    description: 'Comprehensive overview of all equipment in the warehouse management system'
  },
  {
    id: 'swms-inventory',
    name: 'Inventory Overview (SWMS)',
    type: 'PDF',
    size: 'Dynamic',
    lastModified: 'Real-time',
    pdfUrl: null, // Will be fetched from SWMS
    reportPath: '/report/inventory-overview',
    payload: {"userId":"OPS$TEST0100","opcoNumber":"swms","type":"PDF","languageID":3,"prodId":null,"custPreferVendor":null,"brand":null,"recId":null,"descrip":null,"palletType":null,"plogiLoc":null,"logicLoc":null,"status":null,"msku":null,"rdcItem":null,"miniLoad":null,"parentpalletId":null,"mfgSku":null,"vendorId":null,"uom":null,"prodSize":null,"prodSizeUnit":null,"ti":null,"hi":null,"warehouseId":null,"lotId":null,"pack":null,"aisleSide":null,"mxEligible":null,"mxItemAssignFlag":null,"qtyExp":null,"qtyAlc":null,"printerName":null,"reportValue":"mn1rb"},
    content: 'Inventory overview report from SWMS showing stock levels, locations, and product details.',
    category: 'inventory',
    description: 'Real-time inventory levels and product location tracking'
  }
];
