# SWMS SOSS1 Report Analysis and Validation Guide

**Document Version**: 1.0  
**Date**: August 4, 2025  
**Repository**: swms-opco (develop branch)  
**Author**: GitHub Copilot Analysis  

## Executive Summary

The SOSS1 (SOS Short Report) is a critical SWMS (Sysco Warehouse Management System) report that displays information about short items in the SOS (SWMS Order Selection) system. This report provides visibility into items that could not be picked during order selection, showing their status, timing, and resolution details for warehouse management and operational analysis.

## Report Overview

### Purpose
The SOSS1 report displays comprehensive short information from the SOS system, showing:
- Short item details and descriptions
- Short and resolution timing
- Fork lift status and SOS status
- Short quantities and batch information
- Warehouse area and location data
- "Short on short" quantities for tracking subsequent shortages

### Technical Components
- **Main Report**: `soss1.pc` (610 lines) - Full-featured Oracle Pro*C report with globalization support
- **Primary Data Source**: `v_sos_short` view - Complex view joining multiple tables
- **Forms Interface**: None identified (report-only program)

### Database Dependencies
- **Primary View**: `v_SOS_Short` - Main data source providing short information
- **Supporting Tables**: `SOS_SHORT`, `FLOAT_DETAIL`, `FLOATS`, `PM`, `USR`, and others via view
- **Globalization**: Supports multiple languages through global report dictionary

## Report Structure Analysis

### Primary Data Source Query
```sql
SELECT To_Char(Short_Time, 'HH24:MI') as ShortTime,
   To_Char(Resolution_Time, 'HH24:MI') as ResolutionTime,
   Area, Item, Qty_Short, Description, Fork_Status, SOS_Status,
   short_batch_no, qty_short_on_short
   FROM v_SOS_Short
   ORDER BY SOS_Status, Area, Short_Time
```

### Column Layout
| Column | Description | Data Type | Source | Values |
|--------|-------------|-----------|---------|---------|
| Short Time | Time when short occurred | VARCHAR2(5) | v_sos_short.short_time | HH24:MI format |
| Resolution Time | Time when short was resolved | VARCHAR2(5) | v_sos_short.resolution_time | HH24:MI format |
| Area | Warehouse area | CHAR(1) | v_sos_short.area | D/C/F (Dry/Cooler/Freezer) |
| Items | Product identifier | VARCHAR2(7) | v_sos_short.item | Product ID |
| Short Qty | Quantity that was short | NUMBER | v_sos_short.qty_short | Numeric |
| Description | Product description | VARCHAR2(30) | v_sos_short.description | Text description |
| Fork Status | Forklift operation status | VARCHAR2(8) | v_sos_short.fork_status | Various codes |
| SOS Status | SOS processing status | CHAR(1) | v_sos_short.sos_status | S/F/O/null |
| Short Batch | Short batch number | VARCHAR2(10) | v_sos_short.short_batch_no | Batch identifier |
| Sht-On Short | Short on short quantity | NUMBER | v_sos_short.qty_short_on_short | Numeric |

### Report Features
- **Grouping by Status**: Records grouped by SOS_Status with headers
- **Time Formatting**: Uses configurable date/time formats for globalization
- **Multiple Languages**: French translation support via ML_VALUES table
- **Flexible Filtering**: Runtime condition support via command line
- **Status Categories**: 
  - **S** (Selecting): Items currently being selected
  - **F** (Shorts Filled): Items that were short but have been resolved
  - **O** (Outs): Items that are out of stock
  - **null** (Shorts Remaining): Items still short and unresolved

### Report Header Structure
```
     Short    Resolution                       Short                                        Fork     SOS   Short  Sht-On
     Time        Time       Area    Items       Qty  Description                           Status   Status Batch  Short
     -----    ----------    ----    -------    ----- ------------------------------       -------- ------ ------- ------
```

## V_SOS_SHORT View Analysis

### Key Tables in View
- **SOS_SHORT**: Core short transaction data
- **FLOAT_DETAIL**: Order detail information
- **FLOATS**: Float/batch information  
- **PM**: Product master data
- **ORDM/ORDD**: Order header and detail
- **ROUTE**: Route information
- **LOC**: Location data
- **BATCH**: Labor management batch data

### Important Columns from View
- **Short timing**: `short_time`, `resolution_time`
- **Product info**: `item` (prod_id), `description`, `area`
- **Quantities**: `qty_short`, `qty_short_on_short`, `qty_total`
- **Status tracking**: `sos_status`, `fork_status`, `pik_status`
- **Batch info**: `batch_no`, `short_batch_no`
- **Location**: `location`, `dock_float_loc`

## Validation Test Plan

### Pre-Validation Setup

#### Environment Requirements
- Oracle database access with SELECT privileges on v_SOS_Short and related tables
- SQLcl or SQL*Plus client for query execution
- Access to SWMS test/production environment
- Understanding of SOS short processing workflow

#### Test Data Preparation
```sql
-- Verify view accessibility
SELECT COUNT(*) FROM v_sos_short;

-- Check for test data across different statuses
SELECT sos_status, COUNT(*) 
FROM v_sos_short 
GROUP BY sos_status;

-- Verify short batch data exists
SELECT short_batch_no, COUNT(*) 
FROM v_sos_short 
WHERE short_batch_no IS NOT NULL
GROUP BY short_batch_no;
```

### Test Case 1: Data Accuracy Validation

#### Purpose
Verify that the report accurately retrieves and displays data from v_SOS_Short view.

#### SQL Validation Query
```sql
SELECT 
    TO_CHAR(short_time, 'HH24:MI') as short_time_formatted,
    TO_CHAR(resolution_time, 'HH24:MI') as resolution_time_formatted,
    area,
    item,
    qty_short,
    description,
    fork_status,
    sos_status,
    short_batch_no,
    qty_short_on_short
FROM v_sos_short
ORDER BY sos_status, area, short_time;
```

#### Validation Steps
1. Run the SQL query above
2. Compare results with report output for same data
3. Verify all columns match exactly
4. Check time formatting (HH24:MI) matches report
5. Confirm sort order is by SOS_Status, Area, Short_Time

#### Expected Results
- All records from v_SOS_Short should appear in correct order
- Time formatting should be consistent (HH24:MI)
- NULL status records should appear last in grouping
- Descriptions should be properly truncated to 30 characters

### Test Case 2: Status Grouping Validation

#### Purpose
Verify proper grouping and header display for different SOS statuses.

#### SQL Validation Queries
```sql
-- Check status distribution
SELECT 
    sos_status,
    CASE sos_status 
        WHEN 'S' THEN 'SELECTING'
        WHEN 'F' THEN 'SHORTSFILLED' 
        WHEN 'O' THEN 'OUTS'
        WHEN NULL THEN 'SHORTSREMAINING'
        ELSE 'UNKNOWN: ' || sos_status
    END as status_description,
    COUNT(*) as record_count
FROM v_sos_short
GROUP BY sos_status
ORDER BY sos_status;

-- Verify order within each status group
SELECT 
    sos_status,
    area,
    TO_CHAR(short_time, 'HH24:MI') as short_time,
    item,
    ROW_NUMBER() OVER (PARTITION BY sos_status ORDER BY area, short_time) as seq_within_status
FROM v_sos_short
ORDER BY sos_status, area, short_time;
```

#### Validation Steps
1. Check that report shows correct group headers for each status
2. Verify records are properly grouped by status
3. Confirm within-group sorting by area and short_time
4. Validate status header text matches dictionary entries

### Test Case 3: Time Formatting Validation

#### Purpose
Verify proper time formatting and globalization support.

#### SQL Validation Queries
```sql
-- Test time formatting
SELECT 
    short_time as original_time,
    TO_CHAR(short_time, 'HH24:MI') as formatted_time,
    resolution_time as original_resolution,
    TO_CHAR(resolution_time, 'HH24:MI') as formatted_resolution
FROM v_sos_short
WHERE short_time IS NOT NULL 
   OR resolution_time IS NOT NULL;

-- Check for invalid time values
SELECT 
    item,
    short_time,
    resolution_time
FROM v_sos_short
WHERE (short_time IS NOT NULL AND 
       (EXTRACT(HOUR FROM short_time) > 23 OR EXTRACT(MINUTE FROM short_time) > 59))
   OR (resolution_time IS NOT NULL AND 
       (EXTRACT(HOUR FROM resolution_time) > 23 OR EXTRACT(MINUTE FROM resolution_time) > 59));
```

#### Validation Steps
1. Verify time formatting is consistent (HH24:MI)
2. Check that NULL times display as blank/empty
3. Validate no invalid time values exist
4. Confirm globalization date format works correctly

### Test Case 4: Short Quantity Validation

#### Purpose
Verify accuracy of short quantities and "short on short" calculations.

#### SQL Validation Queries
```sql
-- Validate short quantities
SELECT 
    item,
    qty_short,
    qty_short_on_short,
    qty_total,
    CASE 
        WHEN qty_short > qty_total THEN 'WARNING: Short > Total'
        WHEN qty_short_on_short > qty_short THEN 'WARNING: Short-on-Short > Original Short'
        ELSE 'OK'
    END as quantity_check
FROM v_sos_short
WHERE qty_short IS NOT NULL;

-- Check for negative quantities
SELECT 
    item,
    area,
    qty_short,
    qty_short_on_short
FROM v_sos_short
WHERE qty_short < 0 OR qty_short_on_short < 0;

-- Summarize short quantities by area
SELECT 
    area,
    COUNT(*) as short_count,
    SUM(qty_short) as total_short_qty,
    SUM(qty_short_on_short) as total_short_on_short
FROM v_sos_short
WHERE qty_short > 0
GROUP BY area
ORDER BY area;
```

#### Validation Steps
1. Verify all short quantities are positive
2. Check that short-on-short quantities are logical
3. Validate quantity calculations are correct
4. Confirm totals match expected business rules

### Test Case 5: Product and Description Validation

#### Purpose
Verify product information accuracy and description formatting.

#### SQL Validation Queries
```sql
-- Validate product data
SELECT 
    v.item,
    v.description,
    p.prod_id,
    p.descrip,
    LENGTH(v.description) as desc_length
FROM v_sos_short v
LEFT JOIN pm p ON v.item = p.prod_id
WHERE v.item IS NOT NULL;

-- Check for missing product descriptions
SELECT 
    item,
    description,
    area
FROM v_sos_short
WHERE description IS NULL OR TRIM(description) = '';

-- Verify description truncation
SELECT 
    item,
    description,
    LENGTH(description) as length
FROM v_sos_short
WHERE LENGTH(description) > 30;
```

#### Validation Steps
1. Verify all products have valid descriptions
2. Check description length does not exceed 30 characters
3. Validate product IDs exist in PM table
4. Confirm area assignments are correct (D/C/F)

### Test Case 6: Status and Fork Status Validation

#### Purpose
Verify status codes are valid and meaningful.

#### SQL Validation Queries
```sql
-- Validate SOS status codes
SELECT 
    sos_status,
    COUNT(*) as count,
    MIN(short_time) as earliest_short,
    MAX(short_time) as latest_short
FROM v_sos_short
GROUP BY sos_status;

-- Check fork status values
SELECT 
    fork_status,
    COUNT(*) as count
FROM v_sos_short
WHERE fork_status IS NOT NULL
GROUP BY fork_status
ORDER BY fork_status;

-- Cross-reference status combinations
SELECT 
    sos_status,
    fork_status,
    COUNT(*) as combination_count
FROM v_sos_short
GROUP BY sos_status, fork_status
ORDER BY sos_status, fork_status;
```

#### Validation Steps
1. Verify SOS status codes are valid (S/F/O/null)
2. Check fork status codes are meaningful
3. Validate status combinations make business sense
4. Confirm status transitions are logical

### Test Case 7: Performance and Volume Testing

#### Purpose
Verify report performance with various data volumes.

#### SQL Validation Queries
```sql
-- Check total record count and performance
SELECT COUNT(*) as total_records FROM v_sos_short;

-- Analyze data distribution
SELECT 
    TO_CHAR(short_time, 'YYYY-MM-DD') as short_date,
    COUNT(*) as daily_shorts
FROM v_sos_short
WHERE short_time >= SYSDATE - 30
GROUP BY TO_CHAR(short_time, 'YYYY-MM-DD')
ORDER BY short_date;

-- Performance test query
SELECT /* HINT: FIRST_ROWS */ 
    COUNT(*) as count,
    MIN(short_time) as earliest,
    MAX(short_time) as latest,
    AVG(qty_short) as avg_short_qty
FROM v_sos_short
WHERE short_time >= SYSDATE - 7;
```

#### Validation Steps
1. Record execution time for full report
2. Test with date range filters
3. Monitor database resource usage
4. Verify acceptable performance for expected volumes

## Business Logic Validation

### Short Processing Workflow
1. **Item Short Occurs**: During order selection, item cannot be picked in full quantity
2. **Short Recorded**: Short information recorded in SOS_SHORT table
3. **Status Tracking**: SOS_STATUS tracks resolution progress
4. **Resolution**: Short resolved through various methods (replenishment, substitution, etc.)
5. **Short on Short**: Additional shortages on already short items

### Status Meanings
- **S (Selecting)**: Items currently in selection process
- **F (Shorts Filled)**: Previously short items that have been resolved/filled
- **O (Outs)**: Items that are completely out of stock
- **NULL (Shorts Remaining)**: Items still short and awaiting resolution

### Business Rule Validation
```sql
-- Validate business rules
SELECT 
    item,
    sos_status,
    qty_short,
    qty_short_on_short,
    short_time,
    resolution_time,
    CASE 
        WHEN sos_status = 'F' AND resolution_time IS NULL 
        THEN 'WARNING: Filled status but no resolution time'
        WHEN sos_status IS NULL AND resolution_time IS NOT NULL 
        THEN 'WARNING: Resolution time but still short'
        WHEN qty_short_on_short > 0 AND sos_status = 'F'
        THEN 'WARNING: Short-on-short with filled status'
        ELSE 'OK'
    END as business_rule_check
FROM v_sos_short
WHERE qty_short > 0;
```

### Fork Status Integration
```sql
-- Validate fork status relationships
SELECT 
    fork_status,
    sos_status,
    COUNT(*) as count,
    AVG(qty_short) as avg_qty
FROM v_sos_short
WHERE fork_status IS NOT NULL
GROUP BY fork_status, sos_status
ORDER BY fork_status, sos_status;
```

## Report Execution Instructions

### Running the Report (soss1.pc)
```bash
# Standard execution
./soss1

# With output file
./soss1 -o shorts_report.txt

# With custom title
./soss1 -t "Short Items Analysis"

# With condition filter
./soss1 -c "area = 'D' AND qty_short > 5"

# With user ID override
./soss1 -u "MANAGER1"

# With custom page length
./soss1 -l 60

# With error log
./soss1 -e error.log

# Complete example with all options
./soss1 -c "short_time >= SYSDATE-1" -t "Daily Shorts Report" -o daily_shorts.txt -l 55
```

### Command Line Options
- `-c condition`: SQL WHERE condition for filtering data
- `-t title`: Custom report title (default: "SOS Short Report")
- `-u userid`: User ID for report header
- `-o outfile`: Redirect output to specified file
- `-e errorfile`: Redirect error messages to file (default: /dev/null)
- `-l lines`: Set page length (30-80 lines, default: 52)

### Condition Examples
```sql
-- Recent shorts only
"short_time >= SYSDATE - 1"

-- Specific area
"area = 'F'"

-- High quantity shorts
"qty_short > 10"

-- Unresolved shorts
"resolution_time IS NULL"

-- Short batches
"short_batch_no LIKE 'S%'"

-- Multiple conditions
"area IN ('D','C') AND qty_short > 5 AND resolution_time IS NULL"
```

## Troubleshooting Guide

### Common Issues

#### Issue 1: Missing Short Records
**Symptom**: Report shows fewer records than expected  
**Cause**: View filtering or join conditions excluding data  
**Validation Query**:
```sql
-- Check base table vs view counts
SELECT 'SOS_SHORT' as source, COUNT(*) as count FROM sos_short
UNION ALL
SELECT 'V_SOS_SHORT' as source, COUNT(*) as count FROM v_sos_short;
```
**Resolution**: Review view definition for filtering conditions

#### Issue 2: Incorrect Time Formatting
**Symptom**: Times display in wrong format or are missing  
**Cause**: Date format issues or globalization settings  
**Validation Query**:
```sql
-- Check NLS settings
SELECT PARAMETER, VALUE 
FROM NLS_SESSION_PARAMETERS 
WHERE PARAMETER LIKE '%DATE%' OR PARAMETER LIKE '%TIME%';
```
**Resolution**: Verify NLS_DATE_FORMAT and globalization setup

#### Issue 3: Status Grouping Problems
**Symptom**: Records not grouping correctly by status  
**Cause**: Status data issues or sort order problems  
**Validation Query**:
```sql
-- Check status data quality
SELECT 
    sos_status,
    COUNT(*) as count,
    COUNT(DISTINCT area) as areas,
    MIN(short_time) as earliest,
    MAX(short_time) as latest
FROM v_sos_short
GROUP BY sos_status;
```
**Resolution**: Verify status values and sort order logic

#### Issue 4: Performance Issues
**Symptom**: Report takes excessive time to run  
**Cause**: Large data volume or missing indexes  
**Validation Query**:
```sql
-- Check view performance
EXPLAIN PLAN FOR
SELECT * FROM v_sos_short ORDER BY sos_status, area, short_time;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
```
**Resolution**: Add appropriate indexes and consider date range filtering

## Advanced Validation Scenarios

### Data Integrity Checks
```sql
-- Comprehensive data quality assessment
SELECT 
    'Total Records' as metric,
    COUNT(*) as value
FROM v_sos_short
UNION ALL
SELECT 
    'Records with Null Status',
    COUNT(*)
FROM v_sos_short
WHERE sos_status IS NULL
UNION ALL
SELECT 
    'Records Missing Description',
    COUNT(*)
FROM v_sos_short
WHERE description IS NULL OR TRIM(description) = ''
UNION ALL
SELECT 
    'Records with Zero Quantity',
    COUNT(*)
FROM v_sos_short
WHERE qty_short = 0
UNION ALL
SELECT 
    'Short-on-Short Records',
    COUNT(*)
FROM v_sos_short
WHERE qty_short_on_short > 0;
```

### Cross-System Validation
```sql
-- Validate against source tables
SELECT 
    'SOS_SHORT Records' as source,
    COUNT(*) as count
FROM sos_short
WHERE qty_short > 0
UNION ALL
SELECT 
    'View Records',
    COUNT(*)
FROM v_sos_short
UNION ALL
SELECT 
    'FLOAT_DETAIL Links',
    COUNT(*)
FROM v_sos_short v
JOIN float_detail fd ON v.float_no = fd.float_no 
    AND v.float_detail_seq_no = fd.seq_no;
```

### Audit Trail Validation
```sql
-- Check for audit trail completeness
SELECT 
    short_batch_no,
    COUNT(*) as short_count,
    MIN(short_time) as first_short,
    MAX(short_time) as last_short,
    COUNT(CASE WHEN resolution_time IS NOT NULL THEN 1 END) as resolved_count
FROM v_sos_short
WHERE short_batch_no IS NOT NULL
GROUP BY short_batch_no
ORDER BY short_batch_no;
```

## Maintenance Recommendations

### Regular Validation Schedule
- **Daily**: Monitor report execution and verify recent short data
- **Weekly**: Check data quality metrics and status distributions  
- **Monthly**: Review performance trends and optimize queries
- **Quarterly**: Validate business rules and update test cases

### Data Quality Monitoring
```sql
-- Daily monitoring query
SELECT 
    TO_CHAR(SYSDATE, 'YYYY-MM-DD') as report_date,
    COUNT(*) as total_shorts,
    COUNT(CASE WHEN sos_status IS NULL THEN 1 END) as unresolved_shorts,
    COUNT(CASE WHEN qty_short_on_short > 0 THEN 1 END) as short_on_short_count,
    AVG(qty_short) as avg_short_qty
FROM v_sos_short
WHERE short_time >= TRUNC(SYSDATE);
```

### Performance Optimization
```sql
-- Key indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_sos_short_status_area_time 
    ON sos_short(sos_status, area, short_time);
CREATE INDEX IF NOT EXISTS idx_sos_short_batch_no 
    ON sos_short(short_batch_no);
CREATE INDEX IF NOT EXISTS idx_sos_short_time 
    ON sos_short(short_time);
```

## Technical Architecture

### File Locations
- **Source Code**: `/rpts/sos/soss1.pc`
- **View Definition**: `/schema/views/v_sos_short.sql`
- **Documentation**: This file (`SOSS1_Report_Analysis_and_Validation_Guide.md`)

### Dependencies
- Oracle Pro*C compiler
- SWMS common libraries (apcom, aplog)
- Globalization functions (init_globalisation, get_language_date)
- View v_SOS_Short and all underlying tables

### Compilation Requirements
```makefile
# Typical compilation commands
proc soss1.pc
cc -o soss1 soss1.c -lapcom -laplog -lclntsh
```

## Appendix A: Sample Report Output

### Standard Report Format
```
SOSS1        FILENAME                         SOS SHORT REPORT                           PAGE   1
08/04/25     15:30:45                           SYSCO CORPORATION                         USERNAME

     Short    Resolution                       Short                                        Fork     SOS   Short  Sht-On
     Time        Time       Area    Items       Qty  Description                           Status   Status Batch  Short
     -----    ----------    ----    -------    ----- ------------------------------       -------- ------ ------- ------

SHORTSFILLED:
     08:15       08:45        D     ITEM001        5 PRODUCT DESCRIPTION HERE               COMPLETE      F    S123     0
     09:22       10:10        C     ITEM002        2 ANOTHER PRODUCT DESC                   COMPLETE      F    S124     0

OUTS:
     07:30                    F     ITEM003       12 FROZEN PRODUCT DESC                    PENDING       O    S125     0
     11:45                    D     ITEM004        8 DRY GOODS DESCRIPTION                  PENDING       O    S126     0

SELECTING:
     10:15                    C     ITEM005        3 COOLER ITEM DESCRIPTION                ACTIVE        S    S127     0
     12:30                    D     ITEM006        1 SMALL ITEM DESC                        ACTIVE        S    S128     1

SHORTSREMAINING:
     06:45                    D     ITEM007       15 LARGE QUANTITY ITEM                    PENDING              S129     2
     13:20                    F     ITEM008        4 FREEZER ITEM WITH ISSUE                PROBLEM              S130     0
```

## Appendix B: View Dependencies

### v_SOS_Short Key Tables
```sql
-- Primary tables in the view
SOS_SHORT s              -- Core short data
FLOAT_DETAIL fd          -- Order line details  
FLOATS f                 -- Float/batch information
PM p                     -- Product master
ORDM c                   -- Order header
ORDD o                   -- Order detail
ROUTE r                  -- Route information
LOC l                    -- Location data
BATCH b                  -- Labor management
SOS_USR_CONFIG su        -- User configuration
SOS_BATCH sb             -- SOS batch data
```

### Key Join Conditions
```sql
-- Critical joins for data integrity
fd.float_no = s.float_no
fd.seq_no = s.float_detail_seq_no
f.float_no = fd.float_no
o.order_id = fd.order_id
o.order_line_id = fd.order_line_id
p.prod_id = o.prod_id
sb.batch_no = s.batch_no
```

---

**End of Document**

This comprehensive validation guide provides QA engineers and warehouse management with the tools and procedures needed to thoroughly test and validate the SOSS1 short report, ensuring accurate and reliable short tracking and resolution in the SWMS environment.

For questions or updates to this document, please contact the SWMS development team or update this document in the repository.
