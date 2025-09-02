# MC1RA Report Validation Instructions

## Overview

**MC1RA** represents a dual-implementation maintenance reporting system within SWMS that covers both **Reason Codes Overview** (SQL version) and **Adjustment Type Overview** (Pro*C version) that provides a comprehensive listing of all reason codes used in the system. This report is critical for maintaining data integrity and ensuring proper categorization of various warehouse operations and transactions.

### Report Purpose
- **Primary Function**: Lists all reason codes defined in the system organized by type and group
- **Business Value**: Enables warehouse managers and QA teams to verify reason code configurations
- **Usage Context**: Used for system validation, auditing, and maintenance activities
- **Output Format**: Formatted text report with hierarchical grouping

### Report Structure
The MC1RA report contains the following key components:
1. **Header Section**: Report title, date, time, user, and page information
2. **Reason Code Listings**: Organized by reason code type with descriptions
3. **Summary Section**: Count of reason codes by type
4. **Footer**: End of report marker

---

## Technical Architecture

### Core Files
| File | Purpose | Location |
|------|---------|----------|
| `mc1ra.sql` | Main SQL report script | `/rpts/mnt/mc1ra.sql` |
| `mc1ra.pc` | C program for report generation | `/rpts/mnt/mc1ra.pc` |

### Database Dependencies
- **Primary Table**: `REASON_CDS` - Master table containing all reason codes
- **Supporting Tables**:
  - `GLOBAL_REPORT_DICT` - Multi-language report labels
  - `GLOBAL_DATE_FORMAT` - Date/time formatting
  - `NLS_SESSION_PARAMETERS` - Language settings

### Key Data Elements
- **REASON_CD_TYPE**: Category of reason code (RTN, DIS, ADJ, etc.)
- **REASON_CD**: 3-character reason code identifier
- **REASON_DESC**: Full description of the reason code
- **REASON_GROUP**: Functional grouping within type
- **CC_REASON_CODE**: Related cycle count reason code

---

## Validation Steps

### Step 1: Pre-Validation Setup

#### 1.1 Environment Verification
```bash
# Verify report files exist
ls -la /path/to/swms/rpts/mnt/mc1ra.*

# Check database connectivity
sqlplus username/password@database
```

#### 1.2 User Permissions Check
- Ensure test user has SELECT access to:
  - `REASON_CDS` table
  - `GLOBAL_REPORT_DICT` table
  - `GLOBAL_DATE_FORMAT` table
  - `NLS_SESSION_PARAMETERS` view

### Step 2: Generate Test Report

#### 2.1 Execute Report Generation
```sql
-- Run the MC1RA report with specific parameters
@mc1ra.sql [REASON_CODE_TYPE] [OUTPUT_FILE]
```

Example:
```sql
@mc1ra.sql RTN mc1ra_test_output.txt
```

#### 2.2 Capture Output Information
- Note the execution timestamp
- Record any error messages
- Verify output file generation
- Check file size and format

### Step 3: Header Validation

#### 3.1 Report Title Verification
**Expected Format:**
```
MC1RA                REASON CODES OVERVIEW REPORT -- [TYPE]      PAGE   1
[DATE]  [TIME]                    [PARAMETER_VALUE]                [USER]
```

**Validation Points:**
- [ ] Report ID "MC1RA" appears in correct position
- [ ] Title matches expected text pattern
- [ ] Page number starts at 1
- [ ] Date format matches system locale (DD-MON-YY or MM/DD/YY)
- [ ] Time format is HH24:MI
- [ ] User ID is properly displayed (without OPS$ prefix)
- [ ] Parameter value matches input if provided

#### 3.2 Multi-Language Support Check
If system supports multiple languages:
- [ ] Title appears in correct language based on user session
- [ ] Column headers match language setting
- [ ] French language support verified (if applicable)

### Step 4: Data Content Validation

#### 4.1 Database Comparison Query
Execute this SQL to get expected data for comparison:

```sql
SELECT REASON_CD_TYPE,
       REASON_GROUP,
       REASON_CD,
       REASON_DESC
FROM   REASON_CDS
WHERE  1=1
ORDER BY REASON_CD_TYPE, REASON_GROUP, REASON_CD;
```

#### 4.2 Data Accuracy Verification
For each reason code entry in the report:
- [ ] **Reason Code Type**: Verify grouping by type (RTN, DIS, ADJ, etc.)
- [ ] **Reason Code**: Check 3-character code format
- [ ] **Description**: Validate against database description
- [ ] **Sequence**: Confirm alphabetical ordering within each group

#### 4.3 Common Reason Code Types to Verify
| Type | Description | Expected Count Range |
|------|-------------|---------------------|
| RTN | Return reason codes | 15-30 codes |
| DIS | Disposition codes | 5-15 codes |
| ADJ | Adjustment reason codes | 10-25 codes |
| CC | Cycle count reasons | 5-15 codes |

### Step 5: Formatting and Layout Validation

#### 5.1 Column Alignment Check
- [ ] Reason Code Type header properly aligned
- [ ] Reason Code column (11 characters width)
- [ ] Description column (60 characters width)
- [ ] No data truncation or overflow
- [ ] Consistent spacing between columns

#### 5.2 Page Break Validation
- [ ] Page breaks occur at reason code type changes
- [ ] Headers repeat on new pages
- [ ] Page numbers increment correctly
- [ ] No orphaned headers or data

#### 5.3 Group Break Verification
- [ ] Reason group breaks appear within types
- [ ] Single line spacing between groups
- [ ] Page skip between different reason code types

### Step 6: Summary Section Validation

#### 6.1 Count Verification
The report should include a summary section showing counts by type:

```sql
-- Validation query for summary counts
SELECT '  # OF Reason Codes for '|| REASON_CD_TYPE AS LABEL,
       COUNT(*) AS CNT
FROM   REASON_CDS
WHERE  1=1 
GROUP BY REASON_CD_TYPE 
ORDER BY REASON_CD_TYPE;
```

**Validation Points:**
- [ ] Summary section appears after main data
- [ ] Count labels format correctly
- [ ] Counts match database query results
- [ ] All reason code types included in summary

#### 6.2 Total Count Cross-Check
```sql
-- Verify total count across all types
SELECT COUNT(*) AS TOTAL_REASON_CODES
FROM REASON_CDS;
```

### Step 7: Footer and Completion Validation

#### 7.1 End-of-Report Marker
- [ ] Footer appears: "* * * * * END OF REPORT * * * * *"
- [ ] Footer is centered (approximately 60 characters wide)
- [ ] Proper spacing before footer
- [ ] No additional data after footer

#### 7.2 File Completion Check
- [ ] Report file is complete and not truncated
- [ ] Final page number matches total pages
- [ ] No unexpected characters or formatting issues

### Step 8: Edge Case Testing

#### 8.1 Parameter Testing
Test with different input parameters:

```sql
-- Test with specific reason code type
@mc1ra.sql RTN output_rtn.txt

-- Test with empty parameter (should show all)
@mc1ra.sql "" output_all.txt
```

#### 8.2 Data Boundary Testing
- [ ] Test with maximum length descriptions (60 chars)
- [ ] Verify handling of special characters in descriptions
- [ ] Test with minimum and maximum number of reason codes

#### 8.3 Error Condition Testing
- [ ] Invalid reason code type parameter
- [ ] Database connection issues
- [ ] Insufficient user permissions
- [ ] Output file creation failures

### Step 9: Performance and Resource Validation

#### 9.1 Execution Time Check
- [ ] Report completes within acceptable timeframe (< 30 seconds)
- [ ] No significant resource consumption
- [ ] Memory usage remains stable

#### 9.2 Concurrent Access Testing
- [ ] Multiple users can run report simultaneously
- [ ] No locking or blocking issues
- [ ] Output files don't overwrite each other

### Step 10: Integration Testing

#### 10.1 System Integration Points
- [ ] Report integrates with standard report menu
- [ ] Proper integration with SWMS report framework
- [ ] Compatible with existing report distribution systems

#### 10.2 Workflow Integration
- [ ] Report can be scheduled if needed
- [ ] Output format compatible with downstream systems
- [ ] Proper handling in automated report processes

---

## Common Issues and Troubleshooting

### Issue 1: Missing or Incorrect Headers
**Symptoms:** Headers don't appear or show wrong information
**Solutions:**
- Check `GLOBAL_REPORT_DICT` table for missing entries
- Verify language ID configuration
- Confirm NLS session parameters

### Issue 2: Data Not Appearing
**Symptoms:** Report runs but shows no data
**Solutions:**
- Verify `REASON_CDS` table has data
- Check WHERE clause conditions in SQL
- Confirm user has SELECT permissions

### Issue 3: Formatting Issues
**Symptoms:** Columns misaligned or data truncated
**Solutions:**
- Check column width definitions in SQL
- Verify linesize and pagesize settings
- Review formatting specifications

### Issue 4: Summary Counts Incorrect
**Symptoms:** Summary totals don't match detail counts
**Solutions:**
- Compare summary SQL with detail SQL
- Check for filtering differences
- Verify GROUP BY logic

---

## Database Queries for Manual Validation

### Query 1: Verify Reason Code Data
```sql
SELECT COUNT(*) as total_codes,
       COUNT(DISTINCT reason_cd_type) as total_types,
       COUNT(DISTINCT reason_group) as total_groups
FROM reason_cds;
```

### Query 2: Check for Data Quality Issues
```sql
-- Find reason codes with missing descriptions
SELECT reason_cd_type, reason_cd, reason_desc
FROM reason_cds
WHERE reason_desc IS NULL OR TRIM(reason_desc) = '';

-- Find duplicate reason codes within type
SELECT reason_cd_type, reason_cd, COUNT(*)
FROM reason_cds
GROUP BY reason_cd_type, reason_cd
HAVING COUNT(*) > 1;
```

### Query 3: Validate Report Labels
```sql
SELECT report_name, fld_lbl_name, fld_lbl_desc
FROM global_report_dict
WHERE report_name = 'mc1ra'
ORDER BY fld_lbl_name;
```

---

## Expected Output Sample

```
MC1RA                REASON CODES OVERVIEW REPORT --              PAGE   1
13-DEC-24  14:30                                                  TESTUSER


ADJ

Reason Code    Description of Reason Code
-----------    ---------------------------
ADJ            ADJUSTMENT
CYC            CYCLE COUNT ADJUSTMENT
LOT            LOT CONTROL ADJUSTMENT


DIS

Reason Code    Description of Reason Code
-----------    ---------------------------
DMG            DAMAGED
SAL            SALEABLE
UNS            UNSALEABLE


RTN

Reason Code    Description of Reason Code
-----------    ---------------------------
DMG            DAMAGED PRODUCT
MPK            MISPICK - WRONG PRODUCT
MPR            MISPICK - RIGHT PRODUCT
OVR            OVERAGE
STM            SHORT - MISSING
UNS            UNSALEABLE


Summary

  # OF Reason Codes for ADJ:    15
  # OF Reason Codes for DIS:     8
  # OF Reason Codes for RTN:    23

                    * * * * *  END OF REPORT  * * * * *
```

---

## Quality Assurance Checklist

### Before Report Execution
- [ ] Database connection established
- [ ] Required tables accessible
- [ ] User permissions verified
- [ ] Output directory writable

### During Report Validation
- [ ] Header information correct
- [ ] Data completeness verified
- [ ] Formatting standards met
- [ ] Summary calculations accurate

### After Report Completion
- [ ] Output file generated successfully
- [ ] All sections present and complete
- [ ] No error messages in log
- [ ] Performance metrics acceptable

### Documentation Requirements
- [ ] Test execution date and time recorded
- [ ] Any discrepancies documented
- [ ] Screenshots of key sections captured
- [ ] Sign-off by QA lead completed

---

## Conclusion

The MC1RA report validation process ensures the accuracy and reliability of reason code reporting within the SWMS system. Following these detailed steps will help identify any issues with data accuracy, formatting, or system integration, maintaining the high quality standards required for warehouse operations.

For additional support or questions regarding this validation process, please contact the SWMS support team or refer to the system administration documentation.
