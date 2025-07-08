/**
 * SWMS Report Payload Builder Utility
 * 
 * Helps build payloads for different types of SWMS reports
 * Works with centralized report configuration
 */

import { validateReportConfig } from './reportsConfig';

export const buildSWMSPayload = (report, userId, additionalParams = {}) => {
  // Validate report configuration
  try {
    validateReportConfig(report);
  } catch (error) {
    console.error('Invalid report configuration:', error);
    throw error;
  }

  const basePayload = {
    userId: `OPS$${userId}`,
    opcoNumber: 'swms',
    type: 'PDF',
    reportPath: report.reportPath,
  };

  // Merge base, report-specific, and additional parameters
  const completePayload = {
    ...basePayload,
    ...(report.payload || {}),
    ...additionalParams,
  };

  // Ensure reportValue is set (required field)
  if (!completePayload.reportValue && report.payload?.reportValue) {
    completePayload.reportValue = report.payload.reportValue;
  }

  return completePayload;
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
