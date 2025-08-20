# PN1RA Replenishment List Report Analysis Document

## Overview
This document provides a comprehensive analysis of the PN1RA (Replenishment List Report) in the SWMS (Sysco Warehouse Management System) for QA engineers and technical analysts.

### Report Summary
- **Report ID**: PN1RA
- **Report Name**: Replenishment List Report  
- **Purpose**: Generates detailed replenishment task lists with aisle page breaks, showing inventory movements from source to destination locations
- **Source File**: `rpts/inv/pn1ra.pc` (373 lines)
- **Database View**: `v_pn1ra`
- **Report Library**: Uses `report_util.c` framework

## Technical Architecture

### Programming Environment
- **Language**: C with embedded SQL (Oracle Pro*C)
- **Compiler**: Oracle Pro*C precompiler
- **Database**: Oracle with SWMS schema
- **Framework**: SWMS reporting utilities with globalization support

### File Structure
```
rpts/inv/pn1ra.pc           # Main report source (373 lines)
schema/views/v_pn1ra.sql    # Primary data view with UNION for different replen types
rpts/lib/report_util.c      # Shared reporting utilities
makefile                    # Build configuration
```

## Database Schema Analysis

### Primary View: v_pn1ra
The report relies on the `v_pn1ra` view which combines data from multiple tables and handles three different types of replenishments via UNION:

**Core Tables:**
- `replenlst` (Replenishment List) - Primary replenishment task data
- `pm` (Product Master) - Product information
- `loc` (Location) - Location details and attributes
- `inv` (Inventory) - Source and destination inventory data
- `pallet_type` - Pallet specifications
- `aisle_info` - Aisle configuration
- `swms_sub_areas` - Area code mapping

**Three UNION Sections:**
1. **Standard Replenishments** - Non-miniload/matrix locations
2. **Miniload Replenishments** - MLS slot types
3. **Matrix Replenishments** - MXI/MXT slot types

**Key Fields Retrieved:**
```sql
-- Replenishment Task Information
r.dest_loc, r.pallet_id, r.src_loc, r.prod_id, r.task_id,
r.batch_no, r.status, r.gen_uid, r.qty, r.type

-- Location & Path Information  
l.pik_path, l.pik_aisle, l.cube, l.slot_type, l.uom

-- Product Information
p.pack, p.prod_size, p.prod_size_unit, p.cust_pref_vendor,
p.descrip, p.split_cube, p.case_cube, p.spc

-- Inventory Information
isrc.exp_date, idest.qoh (or calculated for MLS/MXT)

-- Physical Attributes
pa.skid_cube, ssa.area_code, ai.name
```

## Report Processing Logic

### Dynamic SQL Construction
The report builds SQL statements based on system parameters and selection criteria:

```sql
-- Base query components
MASTER_STMT1: "select dest_loc,pallet_id,src_loc,prod_id,DECODE(cust_pref_vendor,'-',' ','*'),pik_path,exp_date,pik_aisle,"

MASTER_STMT2: "lpad(nvl(pack,' '),4) || '/' || trim(prod_size)||trim(prod_size_unit),descrip,split_cube,qoh,qty,cube,slot_type,uom,spc,skid_cube,case_cube"

FROM_STMT: "from v_pn1ra"
```

### NDR Order Configuration
The report supports different ordering based on system parameter `NDR_ORDER_BY`:
- **'Y'**: Order by `dest_loc, prod_id, task_id`
- **'N'**: Order by `src_loc, prod_id, task_id`

### Key Processing Features
1. **Page Breaking**: Automatic page breaks on aisle changes (first 2 characters of location)
2. **Quantity Calculations**: Before/after quantities with percentage full calculations
3. **CPV Handling**: Customer Preferred Vendor indicator formatting
4. **Pack Size Formatting**: Concatenated pack size with product size and units
5. **Globalization Support**: Multi-language field label support
6. **Deep Slot Calculations**: Special handling for multi-position slots

## Report Output Structure

### Master Section
- Report title: "replenishment list report"
- Date/time and user information
- Column headers with globalized labels

### Detail Sections
The report displays replenishment information in formatted columns:

**Column Layout:**
- **TO_SLOT**: Destination location (10 chars)
- **PALLET**: Pallet ID (18 chars)  
- **FROM_SLOT**: Source location (10 chars)
- **PROD_ID**: Product identifier (7 chars)
- **V**: Customer Preferred Vendor indicator (1 char)
- **PACK_SIZE**: Formatted pack/size (14 chars)
- **DESCRIP**: Product description (30 chars)
- **QOH_V Before**: Quantity before replenishment (6 chars)
- **QOH_V After**: Quantity after replenishment (6 chars)
- **PERCENT_FULL**: Slot utilization percentage (7 chars)

### Calculation Logic

#### Before/After Quantities
```c
if (!strncmp(dest_loc[i],location,10)) {
    // Same destination location as previous record
    bqty = aqty;
    if (uom[i] != 1)
        aqty = aqty + (qty[i] / spc[i]);
    else
        aqty += qty[i];
} else {
    // Different destination location
    if (uom[i] != 1) {
        bqty = qoh[i] / spc[i];
        aqty = (qty[i] / spc[i]) + (qoh[i] / spc[i]);
    } else {
        bqty = qoh[i];
        aqty = qty[i] + qoh[i];
    }
}
```

#### Percent Full Calculation
```c
// Calculate split cube based on case cube
calc_split_cube = case_cube[i] / (double)spc[i];

// Deep slot cube calculation
if (slot_type[i][0] >= '0' && slot_type[i][0] <= '9')
    num_pos = slot_type[i][0] - '0';
else
    num_pos = 1;
deep_skid_cube = num_pos * skid_cube[i];

// Percentage calculation
if (uom[i] != 1) {
    full = ((aqty * case_cube[i] + deep_skid_cube) / lcube[i]) * 100.0;   
} else {
    full = ((aqty * calc_split_cube + deep_skid_cube) / lcube[i]) * 100.0; 
}

// Cap at 100%
if (full > 100.00)
    full = 100.00;
```

## Validation Steps for QA Engineers

### 1. Database Validation Queries

#### Verify Core Data Sources
```sql
-- Check view accessibility and record counts
SELECT COUNT(*) as total_replenishments FROM v_pn1ra;

-- Verify replenishment types
SELECT type, COUNT(*) as count 
FROM v_pn1ra 
GROUP BY type 
ORDER BY type;

-- Check slot type distribution
SELECT slot_type, COUNT(*) as count
FROM v_pn1ra 
GROUP BY slot_type 
ORDER BY slot_type;

-- Sample data verification
SELECT dest_loc, pallet_id, src_loc, prod_id, 
       cust_pref_vendor, type, slot_type
FROM v_pn1ra 
WHERE ROWNUM <= 10;
```

#### Test UNION Sections
```sql
-- Standard replenishments (non-MLS/MXI/MXT)
SELECT COUNT(*) as standard_replen
FROM v_pn1ra 
WHERE slot_type NOT IN ('MLS','MXI','MXT');

-- Miniload replenishments
SELECT COUNT(*) as miniload_replen
FROM v_pn1ra 
WHERE slot_type = 'MLS';

-- Matrix replenishments  
SELECT COUNT(*) as matrix_replen
FROM v_pn1ra 
WHERE slot_type IN ('MXI','MXT');
```

#### Validate Pack Size Formatting
```sql
-- Test pack size concatenation logic
SELECT 
    prod_id,
    pack,
    prod_size,
    prod_size_unit,
    LPAD(NVL(pack,' '),4) || '/' || TRIM(prod_size)||TRIM(prod_size_unit) as formatted_pack
FROM v_pn1ra 
WHERE ROWNUM <= 5;
```

#### Check NDR Order Logic
```sql
-- Verify NDR_ORDER_BY system parameter
SELECT config_flag_val 
FROM sys_config 
WHERE config_flag_name = 'NDR_ORDER_BY';

-- Test ordering by destination location
SELECT dest_loc, prod_id, task_id
FROM v_pn1ra 
ORDER BY dest_loc, prod_id, task_id
FETCH FIRST 10 ROWS ONLY;

-- Test ordering by source location  
SELECT src_loc, prod_id, task_id
FROM v_pn1ra 
ORDER BY src_loc, prod_id, task_id
FETCH FIRST 10 ROWS ONLY;
```

### 2. Report Execution Validation

#### Command Line Testing
```bash
# Basic report execution (if accessible)
cd rpts/inv
./pn1ra -o output_file.rpt

# Check for successful completion
echo $?  # Should return 0 for success
```

#### Page Breaking Validation
```sql
-- Test aisle grouping for page breaks
SELECT 
    SUBSTR(dest_loc,1,2) as aisle,
    COUNT(*) as replen_count
FROM v_pn1ra 
GROUP BY SUBSTR(dest_loc,1,2)
ORDER BY aisle;

-- Verify aisle info relationship
SELECT DISTINCT l.pik_aisle, ai.name
FROM loc l, aisle_info ai
WHERE ai.pick_aisle(+) = l.pik_aisle
AND l.logi_loc IN (SELECT dest_loc FROM v_pn1ra WHERE ROWNUM <= 10);
```

#### Output File Verification
1. **File Creation**: Verify report file is generated with correct naming
2. **Header Information**: Check report title, date, user ID, column headers
3. **Page Breaks**: Verify page breaks occur on aisle changes
4. **Data Formatting**: Check column alignment, quantity formatting, percentages
5. **Globalization**: Verify field labels use globalized text when configured
6. **Footer Information**: Check for "End of Report" indicator

### 3. Data Consistency Checks

#### Cross-Reference Validation
```sql
-- Verify replenlst table consistency
SELECT COUNT(*) 
FROM replenlst r
WHERE EXISTS (
    SELECT 1 FROM v_pn1ra v 
    WHERE v.task_id = r.task_id
    AND v.prod_id = r.prod_id
);

-- Check location data integrity  
SELECT COUNT(*)
FROM v_pn1ra v
WHERE EXISTS (
    SELECT 1 FROM loc l 
    WHERE l.logi_loc = v.dest_loc
);

-- Verify product master consistency
SELECT COUNT(*)
FROM v_pn1ra v
WHERE EXISTS (
    SELECT 1 FROM pm p
    WHERE p.prod_id = v.prod_id
    AND p.cust_pref_vendor = v.cust_pref_vendor
);
```

#### Inventory Data Validation
```sql
-- Check source inventory consistency
SELECT COUNT(*)
FROM v_pn1ra v
WHERE EXISTS (
    SELECT 1 FROM inv i
    WHERE i.plogi_loc = v.src_loc
    AND i.logi_loc = v.pallet_id
    AND i.prod_id = v.prod_id
);

-- Verify destination location inventory
SELECT COUNT(*)  
FROM v_pn1ra v
WHERE EXISTS (
    SELECT 1 FROM inv i
    WHERE i.plogi_loc = v.dest_loc
    AND i.prod_id = v.prod_id
);
```

#### Calculation Validation
```sql
-- Test quantity and cube calculations
SELECT 
    v.prod_id,
    v.qty,
    v.qoh,
    v.spc,
    v.uom,
    v.case_cube,
    v.split_cube,
    v.cube as location_cube,
    CASE 
        WHEN v.uom != 1 THEN v.qty / v.spc
        ELSE v.qty
    END as calculated_cases
FROM v_pn1ra v
WHERE ROWNUM <= 5;
```

## Common Issues and Troubleshooting

### Database Issues
1. **View Performance**: Monitor v_pn1ra execution time, especially with UNION operations
2. **Missing Replenishments**: Check replenlst status - report excludes 'PRE' status
3. **Slot Type Issues**: Verify MLS/MXI/MXT slot types are properly categorized

### Report Generation Issues
1. **Page Breaking Problems**: Check aisle configuration and location naming consistency
2. **Quantity Calculation Errors**: Verify SPC (Sales Per Case) values and UOM settings
3. **Globalization Issues**: Ensure proper field count in init_globalisation calls

### Data Quality Issues
1. **Missing Pack Sizes**: Check for NULL pack, prod_size, or prod_size_unit values
2. **Incorrect Percentages**: Verify cube calculations and location cube values
3. **CPV Display Problems**: Check DECODE logic for Customer Preferred Vendor formatting

## SQL Validation Queries for Testing

### Comprehensive Data Verification
```sql
-- Complete replenishment validation
SELECT 
    'Total Replenishments' as metric,
    COUNT(*) as value
FROM v_pn1ra
UNION ALL
SELECT 
    'Active Tasks (non-PRE)',
    COUNT(*)
FROM v_pn1ra 
WHERE status != 'PRE'
UNION ALL
SELECT 
    'Standard Replenishments',
    COUNT(*)
FROM v_pn1ra 
WHERE slot_type NOT IN ('MLS','MXI','MXT')
UNION ALL
SELECT 
    'Miniload Replenishments',
    COUNT(*)
FROM v_pn1ra 
WHERE slot_type = 'MLS'
UNION ALL
SELECT 
    'Matrix Replenishments',
    COUNT(*)
FROM v_pn1ra 
WHERE slot_type IN ('MXI','MXT');
```

### Performance Testing Query
```sql
-- Execution time test with ordering
SET TIMING ON;
SELECT COUNT(*), 
       MIN(dest_loc), 
       MAX(dest_loc),
       MIN(src_loc),
       MAX(src_loc)
FROM v_pn1ra
ORDER BY dest_loc, prod_id, task_id;
```

### Data Quality Validation
```sql
-- Check for potential data quality issues
SELECT 
    'Records with NULL pack' as issue,
    COUNT(*) as count
FROM v_pn1ra 
WHERE pack IS NULL
UNION ALL
SELECT 
    'Records with NULL QOH',
    COUNT(*)
FROM v_pn1ra 
WHERE qoh IS NULL
UNION ALL
SELECT 
    'Records with zero cube',
    COUNT(*)
FROM v_pn1ra 
WHERE NVL(cube,0) = 0
UNION ALL
SELECT 
    'Records with NULL exp_date',
    COUNT(*)
FROM v_pn1ra 
WHERE exp_date IS NULL;
```

## Build and Deployment

### Makefile Integration
The report is integrated into the SWMS build system:
- **Source**: `PN1RA_SRCS = pn1ra.pc`
- **Objects**: `PN1RA_OBJS = pn1ra.o`  
- **Dependencies**: `report_util.o`, `ora_retrv_cond.o`, `globalisation.o`

### Compilation Steps
1. Pro*C precompilation: `pn1ra.pc → pn1ra.c`
2. C compilation: `pn1ra.c → pn1ra.o`
3. Linking with libraries: `pn1ra.o + dependencies → pn1ra`

### Installation
- **Target Directory**: `$(REPORTSDIR)/pn1ra`
- **Install Target**: `install.pn1ra`

## Configuration Parameters

### System Parameters
- **NDR_ORDER_BY**: Controls report ordering logic
  - 'Y': Order by destination location (dest_loc, prod_id, task_id)
  - 'N': Order by source location (src_loc, prod_id, task_id)

### Report Settings
- **Lines Per Page**: 35 items per page (LINES_PER_PAGE constant)
- **Page Breaking**: Automatic on aisle change (first 2 characters of location)
- **Field Lengths**: Configurable via detail_title_width and detail_item_width arrays

## Conclusion

The PN1RA Replenishment List Report is a sophisticated reporting tool that provides comprehensive replenishment task information with intelligent page breaking and detailed quantity calculations. The report handles three distinct types of replenishments (standard, miniload, and matrix) through a unified interface, making it essential for warehouse operations management. Proper validation requires testing the complex view logic, calculation accuracy, and page breaking functionality to ensure reliable replenishment list generation.

---

**Document Version**: 1.0  
**Last Updated**: August 2025  
**Prepared For**: QA Engineering Team  
**Report System**: SWMS (Sysco Warehouse Management System)
