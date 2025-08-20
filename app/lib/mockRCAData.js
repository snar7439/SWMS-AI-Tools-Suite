// Mock RCA data for fallback when LLM is not available
export function generateMockRootCauseAnalysis(issueDescription, timeOccurred, environment) {
  const issueTime = new Date(timeOccurred);
  const formattedDate = issueTime.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = issueTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  return `## Incident Summary
On ${formattedDate}, the SWMS ${environment?.name || 'system'} experienced ${issueDescription.toLowerCase()} due to a database connection pool exhaustion.

## Impact
- **Affected:** SWMS warehouse operations, user transactions, and reporting functions
- **Duration:** Approximately 45 minutes (estimated based on typical incident resolution)
- **Severity:** Sev-2 (Business Operations Impacted)

## Timeline
- **${formattedTime}** – Initial issue detected through system monitoring
- **${issueTime.getHours().toString().padStart(2, '0')}:${(issueTime.getMinutes() + 5).toString().padStart(2, '0')}** – Support team acknowledged and began investigation
- **${issueTime.getHours().toString().padStart(2, '0')}:${(issueTime.getMinutes() + 15).toString().padStart(2, '0')}** – Root cause identified in application logs
- **${issueTime.getHours().toString().padStart(2, '0')}:${(issueTime.getMinutes() + 45).toString().padStart(2, '0')}** – Service restored after database connection pool reset

## Detection
Issue was discovered through automated monitoring alerts indicating high response times and failed database connections.

## Root Cause Summary
Database connection pool exhaustion caused application timeouts and service degradation.

## Root Cause Detailed
Analysis of the application logs and database metrics revealed that the connection pool reached its maximum limit of concurrent connections. This was caused by:

1. **Long-running queries**: Several warehouse inventory queries were taking longer than expected due to missing database indexes
2. **Connection leaks**: Application code was not properly releasing database connections after completing transactions
3. **Increased load**: Higher than normal transaction volume during peak warehouse hours
4. **Configuration issue**: Connection pool timeout settings were too aggressive, not allowing sufficient time for query completion

The combination of these factors led to connection pool depletion, causing new requests to fail with timeout errors.

## Contributing Factors
- Lack of connection pool monitoring and alerting
- Missing database performance monitoring for long-running queries
- Insufficient load testing under peak conditions
- Outdated connection pool configuration from initial deployment

## Confidence Level
Medium — Based on typical patterns observed in SWMS database-related incidents and standard troubleshooting procedures

## Additional Data Needed
- Actual database connection pool metrics from the time of incident
- Application server logs showing specific connection timeout errors
- Database query execution plans for performance analysis`;
}

export function generateMockSolutionAnalysis(issueDescription, timeOccurred, environment) {
  return `## Resolution & Recovery
1. Immediate restart of application service to reset connection pool
2. Emergency increase of database connection pool size limits
3. Identification and termination of long-running database queries
4. Implementation of temporary connection monitoring dashboard

## Immediate Actions Summary
Reset database connections, increase pool limits, and implement temporary monitoring to restore service quickly.

## Immediate Actions Detailed
- **Action 1**: Restart SWMS application services (Timeline: Immediate, Owner: Infrastructure Team)
  - Gracefully shutdown application instances
  - Clear existing connection pool state
  - Restart services with increased connection limits
  
- **Action 2**: Increase database connection pool configuration (Timeline: Within 2 hours, Owner: Database Team)
  - Update max_connections parameter from 100 to 200
  - Adjust connection timeout from 30s to 60s
  - Deploy configuration changes with minimal downtime

- **Action 3**: Implement emergency monitoring (Timeline: Within 4 hours, Owner: Operations Team)
  - Deploy connection pool monitoring dashboard
  - Set up alerts for 80% pool utilization
  - Create automated reporting for connection usage patterns

## Preventive Actions Summary
Implement proper connection management, performance monitoring, and capacity planning to prevent future occurrences.

## Preventive Actions Detailed
- **Action 1**: Code review and connection management audit (Timeline: 2 weeks, Owner: Development Team)
  - Review all database access patterns in codebase
  - Implement proper connection pooling best practices
  - Add automated tests for connection handling

- **Action 2**: Database performance optimization (Timeline: 3 weeks, Owner: Database Team)
  - Analyze and optimize slow-running queries
  - Add missing database indexes based on query patterns
  - Implement query performance monitoring

- **Action 3**: Enhanced monitoring and alerting (Timeline: 1 week, Owner: DevOps Team)
  - Deploy comprehensive database connection monitoring
  - Set up proactive alerts for connection pool utilization
  - Implement automated scaling for connection pools

## Validation Steps
- Monitor database connection metrics for 48 hours post-fix
- Verify application response times return to baseline levels
- Confirm no connection timeout errors in application logs
- Test system under simulated peak load conditions
- Validate all monitoring alerts are functioning correctly

## Lessons Learned

### What Went Well
- Monitoring system successfully detected the issue quickly
- Team coordination was effective during incident response
- Service restoration was completed within acceptable timeframe

### What Could Be Improved
- Need better proactive monitoring for database performance
- Connection pool configuration should be reviewed more regularly
- Load testing should include database connection stress scenarios
- Documentation of database troubleshooting procedures needs updating

## Confidence Level
High — Solution addresses the identified root cause and follows industry best practices for database connection management

## Additional Data Needed
If monitoring reveals different patterns, additional database tuning may be required based on actual usage metrics.`;
}

// Function to determine if we should use mock data
export function shouldUseMockData() {
  // Use mock data if:
  // 1. HF_TOKEN is not configured
  // 2. HF_MODEL is not configured  
  // 3. Environment variable FORCE_MOCK_DATA is set to 'true'
  
  const HF_TOKEN = process.env.HF_TOKEN;
  const HF_MODEL = process.env.HF_MODEL;
  const FORCE_MOCK = process.env.FORCE_MOCK_DATA === 'true';
  
  return FORCE_MOCK || !HF_TOKEN || !HF_MODEL;
}
