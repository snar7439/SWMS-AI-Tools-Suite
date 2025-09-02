# SWMS SOSUC Report Analysis and Validation Guide

**Document Version**: 1.0  
**Date**: August 4, 2025  
**Repository**: swms-opco (develop branch)  
**Author**: GitHub Copilot Analysis  

## Executive Summary

The SOSUC (SOS User Configuration) report is a critical SWMS (Sysco Warehouse Management System) report that displays configuration settings for users in the SOS (SWMS Order Selection) system. This report provides visibility into user-specific settings that control how order selection processes behave for individual users.

## Report Overview

### Purpose
The SOSUC report displays user configuration data from the SOS system, showing individual user settings that control:
- Item scanning requirements
- Label printing preferences
- Quantity entry settings
- Training mode flags
- Equipment assignments
- Download optimization preferences

### Technical Components
- **Main Report**: `sosuc.pc` (687 lines) - Full-featured Oracle Pro*C report with globalization
- **Simplified Report**: `sosucrpt.pc` (439 lines) - Streamlined version with basic formatting
- **Forms Interface**: `sosuc1.fmb` - Oracle Forms interface (binary file)

### Database Tables
- **Primary Table**: `SOS_USR_CONFIG` - User configuration settings
- **Secondary Table**: `USR` - User master information for name lookups

## Report Structure Analysis

### Primary Data Source (sosuc.pc)
```sql
SELECT u.user_id, 
       nvl(usr.user_name, 'USER NAME NOT FOUND') user_name,
       u.job_code,
       nvl(u.must_scan_itm, 'N') must_scan_itm,
       nvl(u.print_fl_label, 'N') print_fl_label,
       nvl(u.enter_qty, 'N') enter_qty,
       nvl(u.print_train_lbl, 'N') print_train_lbl,
       nvl(u.flag_nos_user, 'N') flag_nos_user,
       nvl(u.flag_opt_pull, 'N') flag_opt_pull
FROM sos_usr_config u, 
     usr 
WHERE u.user_id = usr.user_id(+)
ORDER BY u.user_id
```

### Column Layout
| Column | Description | Data Type | Values |
|--------|-------------|-----------|---------|
| User ID | SOS User Identifier | VARCHAR2(30) | Alphanumeric |
| User Name | Full Name from USR table | VARCHAR2(40) | Free text |
| Primary Job Code | Job classification | VARCHAR2(6) | Job codes |
| Must Scan Item | Item scanning requirement | CHAR(1) | Y/N |
| Print Float Label | Float label printing | CHAR(1) | Y/N |
| Enter Qty | Manual quantity entry | CHAR(1) | Y/N |
| Training Label | Training mode labeling | CHAR(1) | Y/N |
| New SOS User | New user indicator | CHAR(1) | Y/N |
| Download Optimum Pull | Optimization setting | CHAR(1) | Y/N |

### Report Features
- **Globalization Support**: Multi-language output with French translation capability
- **Flexible Filtering**: Runtime condition support for selective reporting
- **Multiple Formats**: Standard and simplified output options
- **Error Handling**: Comprehensive Oracle Pro*C error management

## Validation Test Plan

### Pre-Validation Setup

#### Environment Requirements
- Oracle database access with SELECT privileges on SOS_USR_CONFIG and USR tables
- SQLcl or SQL*Plus client for query execution
- Access to SWMS test/production environment

#### Test Data Preparation
```sql
-- Verify table accessibility
SELECT COUNT(*) FROM sos_usr_config;
SELECT COUNT(*) FROM usr;

-- Check for test users
SELECT user_id FROM sos_usr_config WHERE ROWNUM <= 5;
```

### Test Case 1: Data Accuracy Validation

#### Purpose
Verify that the report accurately retrieves and displays data from the database.

#### SQL Validation Query
```sql
SELECT 
    u.user_id,
    NVL(usr.user_name, 'USER NAME NOT FOUND') AS user_name,
    u.job_code,
    NVL(u.must_scan_itm, 'N') AS must_scan_itm,
    NVL(u.print_fl_label, 'N') AS print_fl_label,
    NVL(u.enter_qty, 'N') AS enter_qty,
    NVL(u.print_train_lbl, 'N') AS print_train_lbl,
    NVL(u.flag_nos_user, 'N') AS flag_nos_user,
    NVL(u.flag_opt_pull, 'N') AS flag_opt_pull
FROM sos_usr_config u 
LEFT OUTER JOIN usr ON u.user_id = usr.user_id
ORDER BY u.user_id;
```

#### Validation Steps
1. Run the SQL query above
2. Compare results with report output for same time period
3. Verify all columns match exactly
4. Check NULL handling shows proper default values
5. Confirm sort order is by user_id

#### Expected Results
- All user records from SOS_USR_CONFIG should appear
- User names should resolve from USR table when available
- NULL values should display appropriate defaults (N, USER NAME NOT FOUND)
- Sort order should be alphabetical by user_id

### Test Case 2: User Name Resolution Validation

#### Purpose
Verify proper handling of user name lookups and missing user records.

#### SQL Validation Queries
```sql
-- Test users with valid names
SELECT u.user_id, usr.user_name
FROM sos_usr_config u 
JOIN usr ON u.user_id = usr.user_id
WHERE usr.user_name IS NOT NULL
AND ROWNUM <= 10;

-- Test users without valid USR records
SELECT u.user_id, 
       CASE WHEN usr.user_id IS NULL THEN 'USER NAME NOT FOUND' 
            ELSE usr.user_name 
       END AS displayed_name
FROM sos_usr_config u 
LEFT OUTER JOIN usr ON u.user_id = usr.user_id
WHERE usr.user_id IS NULL
AND ROWNUM <= 5;
```

#### Validation Steps
1. Identify users with and without USR table entries
2. Verify report shows actual names for valid users
3. Confirm "USER NAME NOT FOUND" appears for orphaned SOS users
4. Cross-reference with actual USR table data

### Test Case 3: Configuration Flag Validation

#### Purpose
Verify proper display and default handling of configuration flags.

#### SQL Validation Queries
```sql
-- Check flag value distribution
SELECT 
    must_scan_itm,
    COUNT(*) as count_must_scan
FROM sos_usr_config 
GROUP BY must_scan_itm;

SELECT 
    print_fl_label,
    COUNT(*) as count_print_label
FROM sos_usr_config 
GROUP BY print_fl_label;

-- Verify NULL handling for each flag
SELECT 
    user_id,
    must_scan_itm,
    NVL(must_scan_itm, 'N') AS displayed_must_scan,
    print_fl_label,
    NVL(print_fl_label, 'N') AS displayed_print_label
FROM sos_usr_config 
WHERE must_scan_itm IS NULL 
   OR print_fl_label IS NULL
   OR enter_qty IS NULL
   OR print_train_lbl IS NULL
   OR flag_nos_user IS NULL
   OR flag_opt_pull IS NULL;
```

#### Validation Steps
1. Check flag value distributions match expectations
2. Verify NULL values display as 'N' in report
3. Validate only Y/N values appear in output
4. Confirm all six flag columns are properly handled

### Test Case 4: Sorting and Formatting Validation

#### Purpose
Verify correct sorting, column alignment, and report formatting.

#### SQL Validation Query
```sql
-- Verify sort order
SELECT user_id, ROW_NUMBER() OVER (ORDER BY user_id) as sort_order
FROM sos_usr_config
ORDER BY user_id;

-- Check for potential formatting issues
SELECT 
    user_id,
    LENGTH(user_id) as id_length,
    LENGTH(NVL(usr.user_name, 'USER NAME NOT FOUND')) as name_length,
    job_code,
    LENGTH(job_code) as job_length
FROM sos_usr_config u 
LEFT OUTER JOIN usr ON u.user_id = usr.user_id
WHERE LENGTH(user_id) > 10 
   OR LENGTH(NVL(usr.user_name, 'USER NAME NOT FOUND')) > 40
   OR LENGTH(job_code) > 6;
```

#### Validation Steps
1. Verify alphabetical sorting by user_id
2. Check column alignment in report output
3. Identify any data that might cause formatting issues
4. Validate header alignment with data columns

### Test Case 5: Performance and Volume Testing

#### Purpose
Verify report performance with various data volumes and conditions.

#### SQL Validation Queries
```sql
-- Check total record count
SELECT COUNT(*) as total_users FROM sos_usr_config;

-- Verify join performance
SELECT COUNT(*) as matched_users
FROM sos_usr_config u 
JOIN usr ON u.user_id = usr.user_id;

-- Check for performance issues
EXPLAIN PLAN FOR
SELECT u.user_id, usr.user_name, u.job_code,
       NVL(u.must_scan_itm, 'N'), NVL(u.print_fl_label, 'N'),
       NVL(u.enter_qty, 'N'), NVL(u.print_train_lbl, 'N'),
       NVL(u.flag_nos_user, 'N'), NVL(u.flag_opt_pull, 'N')
FROM sos_usr_config u 
LEFT OUTER JOIN usr ON u.user_id = usr.user_id
ORDER BY u.user_id;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
```

#### Validation Steps
1. Record execution time for full report
2. Test with filtered conditions if supported
3. Monitor database resource usage
4. Verify acceptable performance for expected data volumes

### Test Case 6: Error Handling Validation

#### Purpose
Verify proper handling of database errors and edge conditions.

#### Validation Scenarios
1. **Database Connection Issues**
   - Test report behavior when database is unavailable
   - Verify appropriate error messages

2. **Permission Issues**
   - Test with user lacking SELECT privileges
   - Confirm security error handling

3. **Data Corruption Scenarios**
   - Test with unusual characters in user names
   - Verify handling of very long data values

#### SQL Test Queries
```sql
-- Test unusual characters
SELECT user_id, user_name
FROM usr 
WHERE user_name LIKE '%[^A-Za-z0-9 ]%'
   OR user_id LIKE '%[^A-Za-z0-9]%';

-- Test data boundaries
SELECT user_id, LENGTH(user_id) as id_len
FROM sos_usr_config 
WHERE LENGTH(user_id) > 20;
```

## Business Logic Validation

### Configuration Flag Meanings
1. **Must Scan Item (must_scan_itm)**: Controls whether users must scan items during selection
2. **Print Float Label (print_fl_label)**: Determines if float labels are automatically printed
3. **Enter Qty (enter_qty)**: Allows manual quantity entry during selection
4. **Training Label (print_train_lbl)**: Enables training mode labels for new users
5. **New SOS User (flag_nos_user)**: Identifies users new to the SOS system
6. **Download Optimum Pull (flag_opt_pull)**: Enables optimized pull sequence downloading

### Business Rule Validation
```sql
-- Verify business rules
SELECT 
    user_id,
    job_code,
    CASE 
        WHEN flag_nos_user = 'Y' AND print_train_lbl = 'N' 
        THEN 'WARNING: New user without training labels'
        ELSE 'OK'
    END AS business_rule_check
FROM sos_usr_config
WHERE flag_nos_user = 'Y';
```

### Configuration Dependencies
```sql
-- Check for logical inconsistencies
SELECT 
    user_id,
    must_scan_itm,
    enter_qty,
    CASE 
        WHEN must_scan_itm = 'N' AND enter_qty = 'N' 
        THEN 'WARNING: No scanning and no manual entry allowed'
        ELSE 'OK'
    END AS consistency_check
FROM sos_usr_config
WHERE must_scan_itm = 'N' AND enter_qty = 'N';
```

## Advanced Validation Queries

### Data Integrity Checks
```sql
-- Orphaned SOS configurations
SELECT 'Orphaned SOS Config' as issue_type, COUNT(*) as count
FROM sos_usr_config u 
LEFT OUTER JOIN usr ON u.user_id = usr.user_id
WHERE usr.user_id IS NULL

UNION ALL

-- Invalid job codes
SELECT 'Invalid Job Codes' as issue_type, COUNT(*) as count
FROM sos_usr_config u 
LEFT OUTER JOIN job_code jc ON u.job_code = jc.jbcd_job_code
WHERE u.job_code IS NOT NULL AND jc.jbcd_job_code IS NULL

UNION ALL

-- Duplicate user configurations
SELECT 'Duplicate Users' as issue_type, COUNT(*) - COUNT(DISTINCT user_id) as count
FROM sos_usr_config;
```

### Historical Data Analysis
```sql
-- User configuration changes over time (if audit table exists)
SELECT 
    TO_CHAR(add_date, 'YYYY-MM') as month,
    COUNT(*) as config_changes
FROM sos_usr_config_audit
WHERE add_date >= ADD_MONTHS(SYSDATE, -12)
GROUP BY TO_CHAR(add_date, 'YYYY-MM')
ORDER BY month;
```

### Cross-System Validation
```sql
-- Verify SOS users have proper system access
SELECT 
    u.user_id,
    CASE WHEN ua.user_id IS NULL THEN 'Missing Auth' ELSE 'Has Auth' END as auth_status
FROM sos_usr_config u
LEFT OUTER JOIN usrauth ua ON u.user_id = ua.user_id
LEFT OUTER JOIN auth a ON ua.auth_id = a.auth_id AND a.auth_id = 'SOS'
WHERE ua.user_id IS NULL OR a.auth_id IS NULL;
```

## Troubleshooting Guide

### Common Issues

#### Issue 1: Missing User Names
**Symptom**: Report shows "USER NAME NOT FOUND" for valid users  
**Cause**: User exists in SOS_USR_CONFIG but not in USR table  
**Validation Query**:
```sql
SELECT u.user_id
FROM sos_usr_config u 
LEFT OUTER JOIN usr ON u.user_id = usr.user_id
WHERE usr.user_id IS NULL;
```
**Resolution**: Add missing users to USR table or clean up orphaned SOS config records

#### Issue 2: Unexpected Flag Values
**Symptom**: Report shows values other than Y/N for configuration flags  
**Cause**: Data corruption or manual data entry  
**Validation Query**:
```sql
SELECT user_id, must_scan_itm
FROM sos_usr_config
WHERE must_scan_itm NOT IN ('Y', 'N') 
   AND must_scan_itm IS NOT NULL;
```
**Resolution**: Update invalid flag values to Y or N

#### Issue 3: Performance Issues
**Symptom**: Report takes excessive time to run  
**Cause**: Missing indexes or large data volume  
**Validation Query**:
```sql
SELECT COUNT(*) FROM sos_usr_config;
SELECT INDEX_NAME FROM USER_INDEXES WHERE TABLE_NAME = 'SOS_USR_CONFIG';
```
**Resolution**: Ensure proper indexing on user_id columns

#### Issue 4: Globalization Problems
**Symptom**: Special characters not displaying correctly  
**Cause**: Character set or NLS parameter issues  
**Validation Query**:
```sql
SELECT PARAMETER, VALUE 
FROM NLS_SESSION_PARAMETERS 
WHERE PARAMETER IN ('NLS_CHARACTERSET', 'NLS_LANGUAGE');
```
**Resolution**: Verify proper NLS settings and character set support

## Report Execution Instructions

### Running the Main Report (sosuc.pc)
```bash
# Standard execution
./sosuc

# With output file
./sosuc -o output_file.txt

# With custom title
./sosuc -t "SOS User Configuration Report"

# With user filter
./sosuc -u "USERID"

# With line limit
./sosuc -l 60
```

### Running the Simplified Report (sosucrpt.pc)
```bash
# Basic execution
./sosucrpt

# With condition filter
./sosucrpt "user_id LIKE 'SOS%'"
```

### Command Line Options
- `-o filename`: Redirect output to specified file
- `-t title`: Custom report title
- `-u userid`: Filter by specific user ID
- `-l number`: Set page length (30-80 lines)
- `-c condition`: SQL WHERE condition for filtering

## Maintenance Recommendations

### Regular Validation Schedule
- **Daily**: Monitor report execution time and error logs
- **Weekly**: Verify data consistency between SOS_USR_CONFIG and USR tables
- **Monthly**: Review configuration flag distributions for anomalies
- **Quarterly**: Performance baseline comparison and optimization review

### Data Quality Monitoring
```sql
-- Daily data quality check
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN usr.user_id IS NULL THEN 1 END) as orphaned_records,
    COUNT(CASE WHEN must_scan_itm NOT IN ('Y','N') AND must_scan_itm IS NOT NULL THEN 1 END) as invalid_flags
FROM sos_usr_config u 
LEFT OUTER JOIN usr ON u.user_id = usr.user_id;
```

### Index Recommendations
```sql
-- Verify critical indexes exist
CREATE INDEX IF NOT EXISTS idx_sos_usr_config_user_id ON sos_usr_config(user_id);
CREATE INDEX IF NOT EXISTS idx_usr_user_id ON usr(user_id);
```

### Automated Monitoring Scripts
```sql
-- Create monitoring view for daily checks
CREATE OR REPLACE VIEW v_sosuc_data_quality AS
SELECT 
    'SOS Config Records' as metric,
    COUNT(*) as value
FROM sos_usr_config
UNION ALL
SELECT 
    'Orphaned SOS Records',
    COUNT(*)
FROM sos_usr_config u 
LEFT OUTER JOIN usr ON u.user_id = usr.user_id
WHERE usr.user_id IS NULL
UNION ALL
SELECT 
    'Invalid Flag Values',
    COUNT(*)
FROM sos_usr_config
WHERE (must_scan_itm NOT IN ('Y','N') AND must_scan_itm IS NOT NULL)
   OR (print_fl_label NOT IN ('Y','N') AND print_fl_label IS NOT NULL)
   OR (enter_qty NOT IN ('Y','N') AND enter_qty IS NOT NULL)
   OR (print_train_lbl NOT IN ('Y','N') AND print_train_lbl IS NOT NULL)
   OR (flag_nos_user NOT IN ('Y','N') AND flag_nos_user IS NOT NULL)
   OR (flag_opt_pull NOT IN ('Y','N') AND flag_opt_pull IS NOT NULL);
```

## Technical Architecture

### File Locations
- **Source Code**: `/rpts/sos/sosuc.pc` and `/rpts/sos/sosucrpt.pc`
- **Forms**: `/frms/sos/sosuc1.fmb`
- **Documentation**: This file (`SOSUC_Report_Analysis_and_Validation_Guide.md`)

### Dependencies
- Oracle Pro*C compiler
- SWMS common libraries (apcom, aplog)
- Oracle database connectivity
- SWMS globalization functions

### Compilation Requirements
```makefile
# Typical compilation commands
proc sosuc.pc
cc -o sosuc sosuc.c -lapcom -laplog -lclntsh
```

## Appendix A: Database Schema Reference

### SOS_USR_CONFIG Table Structure
```sql
-- Key columns (based on source code analysis)
USER_ID           VARCHAR2(30)    -- Primary key
JOB_CODE          VARCHAR2(6)     -- Job classification
MUST_SCAN_ITM     CHAR(1)         -- Y/N flag
PRINT_FL_LABEL    CHAR(1)         -- Y/N flag
ENTER_QTY         CHAR(1)         -- Y/N flag
PRINT_TRAIN_LBL   CHAR(1)         -- Y/N flag
FLAG_NOS_USER     CHAR(1)         -- Y/N flag
FLAG_OPT_PULL     CHAR(1)         -- Y/N flag
AUTO_ENTER_KEY    CHAR(1)         -- Y/N flag (newer addition)
PALLET_JACK_ID    VARCHAR2(10)    -- Equipment assignment
BOX_ID            VARCHAR2(10)    -- Box equipment
```

### USR Table Structure (Relevant Columns)
```sql
-- Key columns for user name resolution
USER_ID           VARCHAR2(30)    -- Primary key (matches SOS_USR_CONFIG)
USER_NAME         VARCHAR2(40)    -- Full user name
SUPRVSR_USER_ID   VARCHAR2(30)    -- Supervisor reference
LGRP_LBR_GRP      VARCHAR2(10)    -- Labor group
```

## Appendix B: Sample Report Output

### Standard Report Format
```
SOSUC        FILENAME                    SOS USER CONFIGURATION REPORT                    PAGE   1
08/04/25     15:30:45                        SYSCO CORPORATION                           USERNAME

   USER ID         USER NAME                        PRIMARY   MUST SCAN   PRINT FLOAT   ENTER     TRAINING    NEW SOS   DOWNLOAD
                                                   JOB CODE     ITEM        LABEL       QTY       LABEL       USER    OPTIMUM PULL

   OPERATOR1       John Smith                         SEL           Y             Y           N           N           N           Y
   OPERATOR2       Jane Doe                           SEL           N             Y           Y           N           N           Y
   SUPERVISOR1     Mike Manager                       MGR           N             N           N           N           N           N
   TRAINEE1        USER NAME NOT FOUND                SEL           Y             Y           N           Y           Y           N
```

### Simplified Report Format
```
   USER ID         USER NAME                        JOB CODE    FLAG1   FLAG2   FLAG3   FLAG4

   OPERATOR1       John Smith                          SEL         Y       Y       N       N
   OPERATOR2       Jane Doe                            SEL         N       Y       Y       N
   SUPERVISOR1     Mike Manager                        MGR         N       N       N       N
```

---

**End of Document**

This comprehensive validation guide provides QA engineers with the tools and procedures needed to thoroughly test and validate the SOSUC report, ensuring accurate and reliable SOS user configuration reporting in the SWMS environment.

For questions or updates to this document, please contact the SWMS development team or update this document in the repository.
