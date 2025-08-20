# LB1RG - Monitor User Report: Comprehensive Analysis and Validation Guide

## Executive Summary

The LB1RG report is a critical **Monitor User Report** within the SWMS (Sysco Warehouse Management System) Labor Management module that provides comprehensive performance tracking and productivity analysis for warehouse users. This report serves as a primary tool for supervisors and management to monitor user efficiency, track completed batches, and analyze labor performance metrics including pieces/pallets per hour, time spent versus target times, and indirect labor percentages.

**Report Classification:** Labor Management User Performance Monitoring  
**Primary Function:** User Productivity Tracking and Performance Analysis  
**Data Source:** `batch_monitor_view` with labor management batch data  
**Report Type:** Detailed analytical report with performance calculations  

---

## Table of Contents

1. [Technical Architecture](#technical-architecture)
2. [Report Overview](#report-overview)  
3. [Data Sources and Dependencies](#data-sources-and-dependencies)
4. [Core Functionality Analysis](#core-functionality-analysis)
5. [Performance Calculations](#performance-calculations)
6. [Query Parameters and Filtering](#query-parameters-and-filtering)
7. [Output Format and Structure](#output-format-and-structure)
8. [Code Architecture](#code-architecture)
9. [Validation Testing](#validation-testing)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Maintenance and Optimization](#maintenance-and-optimization)

---

## Technical Architecture

### System Environment
- **Programming Language:** C with embedded SQL (Oracle Pro*C)
- **Database Platform:** Oracle Database
- **Framework:** SWMS Labor Management Reporting System
- **Dependencies:** `report_util` framework, globalization support, aplog logging
- **Build Environment:** Oracle Pro*C precompiler with makefile-based build system

### File Structure
```
Source File: rpts/lm/lb1rg.pc (1,274 lines)
Primary View: batch_monitor_view (no dedicated view file)
Report Framework: report_util integration
Logging: aplog integration for error tracking
```

---

## Report Overview

### Report Purpose
The LB1RG "Monitor User Report" provides comprehensive labor management analytics including:

- **User Performance Tracking:** Monitor individual user productivity metrics
- **Batch Completion Analysis:** Track completed batches (status='C') versus other statuses
- **Time Efficiency Monitoring:** Compare actual time spent against goal/target times  
- **Productivity Calculations:** Pieces per hour and pallets per hour metrics
- **Indirect Labor Analysis:** Track percentage of time spent on indirect tasks
- **Supervisor Oversight:** Supervisor-level reporting for team performance management

### Key Business Functions
1. **Performance Monitoring:** Real-time tracking of user efficiency and productivity
2. **Labor Cost Analysis:** Understanding time allocation and labor costs
3. **Capacity Planning:** Data for workforce planning and scheduling decisions
4. **Compliance Reporting:** Documentation for labor management compliance
5. **Operational Optimization:** Identification of improvement opportunities

---

## Data Sources and Dependencies

### Primary Data Source: batch_monitor_view

The report primarily queries the `batch_monitor_view` which provides a comprehensive view of labor management batch data:

```sql
-- Main query structure from source analysis
SELECT batch_date, ref_no, parent_batch_no,
       kvi_no_piece, kvi_no_pallet,
       total_piece, total_pallet,
       jbcl_job_class, lfun_lbr_func, lgrp_lbr_grp,
       whar_area, user_supervsr_id, batch_no,
       status, jbcd_job_code, user_id,
       actl_start_time, actl_stop_time, actl_time_spent,
       target_time, goal_time
FROM batch_monitor_view
```

### Secondary Data Sources

1. **USR Table:** User information and names
   ```sql
   SELECT user_name 
   FROM usr 
   WHERE user_id = replace(user_id, 'OPS$', NULL)
   ```

2. **JOB_CODE Table:** Job classification and function mappings
3. **Batch Tables:** Labor management batch records
4. **Schedule Tables:** User scheduling and labor group information

### Key Data Fields

| Field Category | Fields | Purpose |
|----------------|--------|---------|
| **User Identification** | user_id, user_name, user_supervsr_id | User tracking and hierarchy |
| **Batch Information** | batch_no, batch_date, status, ref_no | Batch identification and status |
| **Job Classification** | jbcd_job_code, jbcl_job_class, lfun_lbr_func, lgrp_lbr_grp | Work categorization |
| **Time Tracking** | actl_start_time, actl_stop_time, actl_time_spent, goal_time, target_time | Performance timing |
| **Volume Metrics** | total_piece, total_pallet, kvi_no_piece, kvi_no_pallet | Productivity measurements |
| **Location Data** | whar_area, kvi_from_loc, kvi_to_loc | Work location tracking |

---

## Core Functionality Analysis

### Report Processing Flow

1. **Initialization and Setup**
   - Initialize global variables and performance tracking arrays
   - Set up globalization support via `init_globalisation()`
   - Configure report parameters and formatting

2. **Data Retrieval**
   - Execute main cursor against `batch_monitor_view`
   - Apply filtering criteria based on user input parameters
   - Sort data by user_id for grouped processing

3. **Performance Calculations**
   - Calculate pieces per hour and pallets per hour
   - Determine performance percentages (actual vs. goal/target)
   - Compute indirect labor percentages
   - Aggregate totals by user and overall

4. **Report Generation**
   - Format user detail lines with calculated metrics
   - Generate user summary totals
   - Create grand totals across all users
   - Output query criteria summary

### Status Processing Logic

The report processes batches based on their status:

```c
if (status[i][0] == 'C') {
    // Completed batches - include in productivity calculations
    tot_actl_time_spent[j] += actl_time_spent[i];
    if (jbcd_job_code[i][0] != 'I') {
        // Direct labor batches
        tot_pieces[j] += total_piece[i];
        tot_pallets[j] += total_pallet[i];
        tot_comp_time_spent[j] += actl_time_spent[i];
        t_comp_goal_target_time[j] += goal_time[i] + target_time[i];
    }
} else if (status[i][0] == 'M') {
    // Merged batches - no productivity metrics
    tot_pieces[j] += 0;
    tot_pallets[j] += 0;
    t_comp_goal_target_time[j] += 0;
}
```

### Job Code Classification

The report distinguishes between:
- **Direct Labor Batches:** Job codes NOT starting with 'I'
- **Indirect Labor Batches:** Job codes starting with 'I' (e.g., ISTART, ISTOP)
- **Special Handling:** Different calculation logic for each type

---

## Performance Calculations

### Core Performance Metrics

#### 1. Performance Percentage
```c
if ((grand_tot_comp_goal_target > 0) && (grand_tot_comp_time_spent > 0))
    performance_percent = (long)round(
        (grand_tot_comp_goal_target / grand_tot_comp_time_spent) * 100
    );
```

#### 2. Indirect Labor Percentage  
```c
if (grand_tot_actl_time_spent > 0)
    performance_indirect = (long)round(
        (grand_tot_ind_time_spent / grand_tot_actl_time_spent) * 100
    );
```

#### 3. Pieces Per Hour
```c
if (grand_tot_comp_time_spent > 0) {
    pcph = (long)round(
        ((double)grand_tot_pieces * 60.0) / grand_tot_comp_time_spent
    );
}
```

#### 4. Pallets Per Hour
```c
if (grand_tot_comp_time_spent > 0) {
    plph = (long)round(
        ((double)grand_tot_pallets * 60.0) / grand_tot_comp_time_spent
    );
}
```

### Calculation Methodology

**Time Conversion:** All time calculations convert minutes to hours by dividing by 60.0
**Rounding:** Uses custom `round()` and `round_double()` functions with Oracle SQL ROUND()
**Zero Handling:** Prevents division by zero with conditional logic
**Precision:** Uses 3 decimal places for time display formatting

---

## Query Parameters and Filtering

### Supported Filter Criteria

The report supports extensive filtering through a condition statement parser:

#### 1. Batch Filters
- **BATCH_NO:** Specific batch number filtering
- **STATUS:** Batch status (A=Active, C=Completed, M=Merged, etc.)
- **REF_NO:** Reference number filtering

#### 2. User Filters  
- **USER_ID:** Specific user identification
- **USER_SUPERVSR_ID:** Supervisor-based filtering

#### 3. Job Classification Filters
- **JBCD_JOB_CODE:** Job code filtering with special 'I' handling
- **JBCL_JOB_CLASS:** Job class categorization
- **LFUN_LBR_FUNC:** Labor function filtering
- **LGRP_LBR_GRP:** Labor group filtering

#### 4. Location and Time Filters
- **WHAR_AREA:** Warehouse area filtering
- **ACTL_START_TIME:** Start time range filtering (before/after logic)

#### 5. Performance Filters
- **PERF:** Performance percentage filtering
- **PIECE_PER_HOUR:** Pieces per hour filtering  
- **PALLET_PER_HOUR:** Pallets per hour filtering

### Parameter Processing Logic

```c
static void get_jbcd_job_code() {
    // Special handling for job code filtering
    if ((cond_stmt[fr] == '=') || (cond_stmt[fr] == 'L')) {
        jbcd_job_code_ind = 0;  // Direct job code match
        // Extract job code value
    } else {
        jbcd_job_code_ind = 1;  // Indirect/Direct indicator
        if (cond_stmt[fr] == 'N')
            strncpy(s_dir_ind, "D", 1);  // Direct
        else
            strncpy(s_dir_ind, "I", 1);  // Indirect
    }
}
```

---

## Output Format and Structure

### Report Layout

#### Header Section
- Report title and date information
- Column headers for user data and performance metrics
- Globalized labels from REPORT_TITLE array

#### Detail Section
```
User ID | User Name | Supervisor | Pieces | Pallets | Time | %Ind | Perf | Pc/Hr | Pl/Hr
--------|-----------|------------|--------|---------|------|------|------|-------|-------
USER001 | John Doe  | SUPER01    |   1250 |     125 | 8.50 |   15 |  105 |   147 |    15
```

#### Summary Section
- Grand totals across all users
- Overall performance metrics
- Query criteria summary

#### Footer Section
- Query criteria display showing applied filters
- Report generation timestamp and parameters

### Column Specifications

| Column | Width | Format | Description |
|--------|-------|--------|-------------|
| User ID | 8 | Text | User identification |
| User Name | 40 | Text | Full user name from USR table |
| Supervisor | 8 | Text | Supervisor user ID |
| Pieces | 6 | Integer | Total pieces handled |
| Pallets | 7 | Integer | Total pallets handled |
| Time | 7.3 | Decimal | Actual time spent (hours) |
| %Ind | 3 | Integer | Indirect labor percentage |
| Perf | 4 | Integer | Performance percentage |
| Pc/Hr | 4 | Integer | Pieces per hour |
| Pl/Hr | 4 | Integer | Pallets per hour |

---

## Code Architecture

### Main Program Structure

```c
// Main execution flow
int main(int argc, char *argv[]) {
    init_globalisation();     // Initialize globalization
    get_report();            // Main report processing
    return 0;
}
```

### Key Functions

#### 1. get_report()
- **Purpose:** Main report processing coordination
- **Responsibilities:** Data retrieval, processing, and output generation
- **Error Handling:** Comprehensive Oracle error checking

#### 2. place_details()
- **Purpose:** Format individual user detail lines
- **Calculations:** User-level performance metrics
- **Database Access:** User name lookup from USR table

#### 3. print_totals()
- **Purpose:** Generate grand total summary
- **Calculations:** Overall performance aggregations
- **Formatting:** Standardized numeric display

#### 4. get_cond() and Related Parsers
- **Purpose:** Parse and process filter conditions
- **Flexibility:** Dynamic condition statement processing
- **Validation:** Parameter value extraction and validation

### Memory Management

```c
// Array sizing for batch processing
#define DETAIL_LEN 30

// Performance tracking arrays
tot_pieces[DETAIL_LEN]
tot_pallets[DETAIL_LEN]  
tot_actl_time_spent[DETAIL_LEN]
tot_comp_time_spent[DETAIL_LEN]
tot_ind_time_spent[DETAIL_LEN]
```

### Error Handling Strategy

1. **Oracle Error Checking:** Comprehensive `sqlca.sqlcode` validation
2. **Logging Integration:** `aplog_log()` for error tracking
3. **Graceful Degradation:** Continue processing when possible
4. **User Feedback:** Clear error messages for resolution

---

## Validation Testing

### Test Scenarios

#### 1. Basic Functionality Tests
```sql
-- Test 1: Single user completed batches
-- Expected: User detail line with correct calculations

-- Test 2: Multiple users mixed statuses  
-- Expected: Proper status filtering and aggregation

-- Test 3: Indirect vs. direct job codes
-- Expected: Correct separation in calculations
```

#### 2. Performance Calculation Validation

**Test Case: Verify Pieces Per Hour Calculation**
```
Input: 1000 pieces, 480 minutes (8 hours)
Expected: (1000 * 60) / 480 = 125 pieces/hour
Validation: Check against manual calculation
```

**Test Case: Verify Performance Percentage**
```
Input: Goal=480 minutes, Actual=440 minutes  
Expected: (480 / 440) * 100 = 109%
Validation: Confirm rounding to nearest integer
```

#### 3. Filtering and Parameter Tests

**User ID Filtering:**
```
Input: USER_ID = 'TEST001'
Expected: Only batches for TEST001 user
Validation: Verify no other users in output
```

**Date Range Filtering:**
```
Input: ACTL_START_TIME > '2024-01-01'
Expected: Only batches after specified date
Validation: Check all output dates
```

#### 4. Edge Case Testing

**Zero Values:**
- Test with zero pieces/pallets
- Test with zero time spent
- Test with missing goal/target times

**Large Datasets:**
- Test with maximum user count (30 per page)
- Test with extensive date ranges
- Performance validation with large result sets

#### 5. Integration Testing

**Database Dependencies:**
- Validate batch_monitor_view accessibility
- Confirm USR table joins work correctly
- Test with various Oracle user contexts

**Report Framework:**
- Test globalization label loading
- Validate page formatting functions
- Confirm aplog integration works

### Validation Checklist

- [ ] **Data Accuracy:** Output matches manual calculations
- [ ] **Performance:** Report executes within acceptable timeframes
- [ ] **Formatting:** Columns align properly, numbers display correctly  
- [ ] **Filtering:** All parameter combinations work as expected
- [ ] **Error Handling:** Graceful handling of database issues
- [ ] **Totals:** Grand totals match sum of detail lines
- [ ] **User Names:** Proper resolution from USR table
- [ ] **Time Zones:** Globalization handles time display correctly

---

## Troubleshooting Guide

### Common Issues and Resolutions

#### 1. Database Connection Issues

**Symptom:** Oracle connection failures or timeout errors
```
ORACLE SQL FETCH # 1 master CURSOR FAILED
```

**Resolution Steps:**
1. Verify Oracle database connectivity
2. Check user permissions for batch_monitor_view
3. Validate TNS configuration
4. Review Oracle error logs

#### 2. Performance Calculation Discrepancies

**Symptom:** Performance percentages don't match expected values

**Diagnostic Steps:**
1. Verify goal_time and target_time values in source data
2. Check for null values affecting calculations
3. Validate rounding function behavior
4. Review time unit conversions (minutes vs. hours)

**Sample Debug Query:**
```sql
SELECT user_id, batch_no, 
       goal_time, target_time, actl_time_spent,
       (goal_time + target_time) / actl_time_spent * 100 as calc_perf
FROM batch_monitor_view 
WHERE user_id = 'PROBLEM_USER'
  AND status = 'C';
```

#### 3. Missing User Names

**Symptom:** User names appear blank or show error values

**Resolution:**
1. Check USR table data completeness
2. Verify user_id format consistency (OPS$ prefix handling)
3. Review database permissions for USR table access

```sql
-- Debug query for user name resolution
SELECT user_id, replace(user_id, 'OPS$', NULL) as clean_id, user_name
FROM usr 
WHERE user_id IN (SELECT DISTINCT user_id FROM batch_monitor_view);
```

#### 4. Report Output Formatting Issues

**Symptom:** Columns misaligned or numbers displaying incorrectly

**Debugging Steps:**
1. Check globalization settings and REPORT_TITLE array
2. Verify numeric formatting string specifications
3. Review page width and column spacing calculations
4. Test with different locale settings

#### 5. Filter Parameter Problems

**Symptom:** Filters not working or producing unexpected results

**Resolution:**
1. Trace condition statement parsing in `get_cond()` function
2. Verify parameter value extraction logic
3. Check for proper SQL condition construction
4. Test individual filter components in isolation

### Error Code Reference

| Error Code | Description | Resolution |
|------------|-------------|------------|
| ORA-00942 | Table or view does not exist | Verify batch_monitor_view exists and is accessible |
| ORA-01403 | No data found | Check filter criteria and data availability |
| -20104 | Unable to insert into batch table | Check batch table permissions and constraints |
| SQLCODE 100 | No more rows to fetch | Normal end-of-data condition |

### Performance Optimization Issues

**Symptom:** Report runs slowly or times out

**Optimization Steps:**
1. Review query execution plans for batch_monitor_view
2. Check for proper indexing on filter columns
3. Consider query hint optimization
4. Monitor Oracle session statistics during execution

---

## Maintenance and Optimization

### Regular Maintenance Tasks

#### 1. Database Performance Monitoring
- **Monthly:** Review batch_monitor_view performance
- **Quarterly:** Analyze index usage and optimization opportunities
- **Annually:** Archive old batch data and assess retention policies

#### 2. Code Maintenance
- **Version Control:** Maintain source code in repository with change tracking
- **Documentation:** Update inline comments for any modifications
- **Testing:** Re-run validation tests after any changes

#### 3. Data Integrity Checks
```sql
-- Monthly data quality check
SELECT COUNT(*) as total_batches,
       COUNT(CASE WHEN status = 'C' THEN 1 END) as completed,
       COUNT(CASE WHEN goal_time IS NULL THEN 1 END) as missing_goals
FROM batch_monitor_view 
WHERE batch_date >= TRUNC(SYSDATE) - 30;
```

### Optimization Opportunities

#### 1. Query Performance Enhancement
- **Indexing Strategy:** Ensure proper indexes on frequently filtered columns
- **Partitioning:** Consider partitioning batch tables by date for large datasets
- **Statistics:** Keep Oracle statistics current for optimal execution plans

#### 2. Application Performance
- **Array Processing:** Optimize array sizing for typical data volumes
- **Memory Management:** Monitor memory usage patterns
- **Cursor Optimization:** Review cursor design for efficiency

#### 3. Reporting Enhancements
- **Pagination:** Implement better pagination for large user sets
- **Export Options:** Consider additional output formats (CSV, Excel)
- **Scheduling:** Enable automated report generation capabilities

### Future Enhancement Considerations

1. **Web Interface:** Migration to web-based reporting platform
2. **Real-time Updates:** Integration with live dashboard systems
3. **Mobile Access:** Mobile-friendly report viewing capabilities
4. **Advanced Analytics:** Integration with business intelligence tools
5. **API Development:** RESTful API for programmatic access

### Change Management Process

1. **Requirements Analysis:** Document all proposed changes
2. **Impact Assessment:** Evaluate effects on existing functionality
3. **Testing Protocol:** Comprehensive testing in development environment
4. **Deployment Planning:** Coordinated release with stakeholder communication
5. **Post-Implementation Review:** Monitor performance and gather user feedback

---

## Conclusion

The LB1RG Monitor User Report serves as a cornerstone of the SWMS Labor Management reporting system, providing essential insights into user productivity and performance metrics. Its comprehensive approach to tracking completed batches, calculating performance percentages, and monitoring labor efficiency makes it an invaluable tool for warehouse operations management.

The report's robust architecture, featuring detailed performance calculations, flexible filtering capabilities, and comprehensive error handling, ensures reliable operation in production environments. Regular maintenance and monitoring of the underlying data sources, combined with ongoing performance optimization, will ensure continued effectiveness in supporting warehouse management decisions.

For optimal results, users should:
- Regularly validate calculation accuracy against business requirements
- Monitor database performance and optimize as needed
- Maintain current documentation and testing procedures
- Consider future enhancements to meet evolving business needs

This analysis provides the foundation for effective use, maintenance, and enhancement of the LB1RG reporting capability within the broader SWMS ecosystem.

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Next Review:** Quarterly  
**Contact:** SWMS Development Team
