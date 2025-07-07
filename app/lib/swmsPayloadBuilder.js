/**
 * SWMS Report Payload Builder Utility
 * 
 * Helps build payloads for different types of SWMS reports
 */

export const buildSWMSPayload = (report, userId, additionalParams = {}) => {
  const basePayload = {
    userId: `OPS$${userId}`,
    opcoNumber: 'swms',
    type: 'PDF',
    reportPath: report.reportPath, // Include the report path
  };

  // Merge base, report-specific, and additional parameters
  return {
    ...basePayload,
    ...(report.payload || {}),
    ...additionalParams,
  };
};

export const getReportPayloadTemplate = (reportType) => {
  const templates = {
    'equipment-overview': {
      reportValue: 'me1ra',
      type: 'PDF',
      equipId: null,
      zoneId: null,
      printerName: null,
    },
    'inventory-overview': {
      reportValue: 'mn1rb',
      type: 'PDF',
    },
    'performance': {
      reportValue: 'perf1ra',
      type: 'PDF',
      equipId: null,
      zoneId: null,
      printerName: null,
      dateRange: '30days',
      metricType: 'efficiency',
      departmentId: 'DEPT001',
    },
    'safety': {
      reportValue: 'safety1ra',
      type: 'PDF',
      equipId: null,
      zoneId: null,
      printerName: null,
      incidentLevel: 'ALL',
      dateFrom: null,
      dateTo: null,
    },
    'maintenance': {
      reportValue: 'maint1ra',
      type: 'PDF',
      equipId: null,
      zoneId: null,
      printerName: null,
      maintenanceType: 'SCHEDULED',
      priorityLevel: 'ALL',
    },
  };

  return templates[reportType] || templates['equipment-overview'];
};

export const validatePayload = (payload) => {
  const requiredFields = ['userId', 'opcoNumber', 'reportValue', 'type', 'reportPath'];
  
  for (const field of requiredFields) {
    if (!payload[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return true;
};
