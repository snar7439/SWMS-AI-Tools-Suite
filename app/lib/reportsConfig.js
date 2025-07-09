/**
 * Centralized SWMS Reports Configuration
 * 
 * Direct payload approach - payloads are sent directly from config to SWMS API
 */

export const swmsReports = [
  {
    id: 'equipment-overview',
    name: 'Equipment Overview',
    type: 'PDF',
    lastModified: 'Real-time',
    pdfUrl: null, // Will be fetched from SWMS
    reportPath: '/report/equipment-overview',
    payload: {"userId":"OPS$TEST0100","languageID":3,"opcoNumber":"swms","type":"PDF","equipId":null,"zoneId":null,"printerName":null,"reportValue":"me1ra"}
  },
  {
    id: 'inventory-overview',
    name: 'Inventory Overview',
    type: 'PDF',
    lastModified: 'Real-time',
    pdfUrl: null, // Will be fetched from SWMS
    reportPath: '/report/inventory-overview',
    payload: {"userId":"OPS$TEST0100","opcoNumber":"swms","type":"PDF","languageID":3,"prodId":null,"custPreferVendor":null,"brand":null,"recId":null,"descrip":null,"palletType":null,"plogiLoc":null,"logicLoc":null,"status":null,"msku":null,"rdcItem":null,"miniLoad":null,"parentpalletId":null,"mfgSku":null,"vendorId":null,"uom":null,"prodSize":null,"prodSizeUnit":null,"ti":null,"hi":null,"warehouseId":null,"lotId":null,"pack":null,"aisleSide":null,"mxEligible":null,"mxItemAssignFlag":null,"qtyExp":null,"qtyAlc":null,"printerName":null,"reportValue":"mn1rb"}
  },
  {
    id: 'item-overview-item',
    name: 'Item Overview by Item',
    type: 'PDF',
    lastModified: 'Real-time',
    pdfUrl: null, // Will be fetched from SWMS
    reportPath: '/report/item-overview-item',
    payload: {"userId":"OPS$TEST0100","opcoNumber":"swms","prodId":null,"palletType":null,"description":null,"cpv":null,"mfgId":null,"brand":null,"reportName":"Item Overview by Item","location":null,"rdcItem":null,"miniLoadItem":null,"ti":null,"hi":null,"printerName":null,"reportValue":"mi1ra","type":"PDF"}
  },
  {
    id: 'replenishment-list',
    name: 'Replenishment List',
    type: 'PDF',
    lastModified: 'Real-time',
    pdfUrl: null, // Will be fetched from SWMS
    reportPath: '/report/replenishment-list',
    payload: {"userId":"OPS$TEST0100","opcoNumber":"swms","type":"PDF","areaCode":null,"expDate":null,"fromSlot":null,"languageId":3,"nbtGenDate":null,"nbtGenUid":null,"palletType":null,"perUsage":null,"pikAisleFrom":null,"pikAisleTo":null,"priority":null,"prodId":null,"splitOnly":null,"status":null,"toSlot":null,"printerName":null,"reportValue":"pn1ra"}
  },
  {
    id: 'shortage-report',
    name: 'Shortage',
    type: 'PDF',
    lastModified: 'Real-time',
    pdfUrl: null, // Will be fetched from SWMS
    reportPath: '/report/shortage-report',
    payload: {"userId":"OPS$TEST0100","opcoNumber":"swms","type":"PDF","languageId":3,"customerId":null,"customerName":null,"orderId":null,"shipDate":null,"printerName":null,"reportValue":"oo1ra"}
  },
  {
    id: 'labor-monitor-by-user-report',
    name: 'Monitor User Report',
    type: 'PDF',
    lastModified: 'Real-time',
    pdfUrl: null, // Will be fetched from SWMS
    reportPath: '/report/labor-monitor-by-user-report',
    payload: {"userId":"OPS$TEST0100","opcoNumber":"swms","printerName":null,"reportValue":"lb1rg","type":"PDF"}
  },
  {
    id: 'cool-item-cross-reference-all-item',
    name: 'All cool items',
    type: 'PDF',
    lastModified: 'Real-time',
    pdfUrl: null, // Will be fetched from SWMS
    reportPath: '/report/cool-item-cross-reference-all-item',
    payload: {"userId":"OPS$TEST0100","opcoNumber":"swms","type":"PDF","languageId":3,"category":null,"custPrefVendor":null,"descrip":null,"prodId":null,"printerName":null,"reportValue":"mc1rc"}
  },
  {
    id: 'item-overview-by-area',
    name: 'Item Overview by Area',
    type: 'PDF',
    lastModified: 'Real-time',
    pdfUrl: null, // Will be fetched from SWMS
    reportPath: '/report/item-overview-by-area',
    payload: {"userId":"OPS$TEST0100","opcoNumber":"swms","prodId":null,"palletType":null,"description":null,"cpv":null,"mfgId":null,"brand":null,"reportName":"Item Overview by Area","location":null,"rdcItem":null,"miniLoadItem":null,"ti":null,"hi":null,"printerName":null,"reportValue":"mi1rd","type":"PDF"}
  },
  {
    id: 'packing-list-for-R042',
    name: 'Packing List',
    type: 'PDF',
    lastModified: 'Real-time',
    pdfUrl: null, // Will be fetched from SWMS
    reportPath: '/report/packing-list-for-R042',
    payload: {"userId":"OPS$TEST0100","opcoNumber":"swms","type":"PDF","languageId":3,"customerId":null,"customerName":null,"orderId":null,"shipDate":null,"printerName":null,"reportValue":"ob1rg"}
  },
];
