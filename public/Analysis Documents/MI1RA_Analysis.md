# MI1RA Item Overview Report Analysis Document

## Overview
This document provides a comprehensive analysis of the MI1RA (Item Overview Report) in the SWMS (Sysco Warehouse Management System) for QA engineers and technical analysts.

### Report Summary
- **Report ID**: MI1RA
- **Report Name**: Item Overview Report  
- **Purpose**: Provides detailed item warehouse information including product details, inventory quantities, vendor information, and warehouse locations
- **Source File**: `rpts/inv/mi1ra.pc` (482 lines)
- **Database View**: `v_mi1ra_2`
- **Report Library**: Uses `report_util.c` framework

## Technical Architecture

### Programming Environment
- **Language**: C with embedded SQL (Oracle Pro*C)
- **Compiler**: Oracle Pro*C precompiler
- **Database**: Oracle with SWMS schema
- **Framework**: SWMS reporting utilities

### File Structure
```
rpts/inv/mi1ra.pc       # Main report source (482 lines)
schema/views/v_mi1ra_2.sql  # Primary data view
rpts/lib/report_util.c  # Shared reporting utilities
makefile               # Build configuration
```

## Database Schema Analysis

### Primary View: v_mi1ra_2
The report relies on the `v_mi1ra_2` view which combines data from multiple tables:

**Core Tables:**
- `pm` (Product Master) - Primary product information
- `loc` (Location) - Warehouse location data  
- `inv` (Inventory) - Current inventory levels
- `awm` (AWM data) - Warehouse movement metrics
- `v_mi1ra_1` - Supporting view for on-order quantities
- `swms_areas` / `swms_sub_areas` - Area configuration

**Key Fields Retrieved:**
```sql
-- Product Information
p.prod_id, p.cust_pref_vendor, p.container, p.pack, 
p.prod_size, p.prod_size_unit, p.brand, p.descrip, 
p.mfg_sku, p.avg_wt, p.spc, p.ti, p.hi

-- Vendor Information  
DECODE(p.rdc_vendor_id, NULL, p.vendor_id, p.rdc_vendor_id) vendor_id,
p.rdc_vendor_id

-- Location & Inventory
p.area, l.logi_loc, a1.qty awm, a2.qty pick_freq

-- On Order Quantities
v.cases_on_order, v.splits_on_order

-- System Attributes
p.pallet_type, p.miniload_storage_ind
```

## Report Processing Logic

### Main SQL Query (MASTER_STMT)
```sql
SELECT prod_id, 
       decode(cust_pref_vendor,'-',' ','*'), 
       cust_pref_vendor,
       container, 
       LPAD(LTRIM(pack,' '),4,' '), 
       prod_size, 
       decode(sign((length(trim(prod_size)||trim(prod_size_unit)))-6),
              +1,TRIM(pack)||'/'||trim(prod_size)||trim(prod_size_unit),
              LPAD(LTRIM(pack),4,' ')||'/'||trim(prod_size)||trim(prod_size_unit)), 
       brand,
       SUBSTR(descrip,1,27), 
       SUBSTR(LPAD(mfg_sku,14,' '),8,7), 
       avg_wt,
       vendor_id,
       area, 
       logi_loc, 
       nvl(spc,0),
       nvl(awm,0),
       pick_freq, 
       nvl(cases_on_order,0),
       nvl(splits_on_order,0), 
       vendor_id 
FROM v_mi1ra_2
```

### Key Processing Features
1. **Globalization Support**: Uses `init_globalisation()` for multi-language support
2. **Report Formatting**: Implements standardized SWMS report layout
3. **Data Transformation**: Pack size concatenation and field formatting
4. **Cursor Processing**: Efficient database cursor handling via `get_report()`

## Report Output Structure

### Master Section
- Report title and date/time
- User information
- Total record counts

### Detail Sections
The report displays item information in formatted columns:

**Column Layout:**
- Product ID
- Customer Preferred Vendor indicator  
- Container type
- Pack size with formatting
- Product size with unit
- Brand name
- Description (truncated to 27 chars)
- Manufacturing SKU (formatted)
- Average weight
- Vendor ID
- Area designation
- Logical location
- SPC (Sales Per Case)
- AWM quantity
- Pick frequency
- Cases on order
- Splits on order

## Validation Steps for QA Engineers

### 1. Database Validation Queries

#### Verify Core Data Sources
```sql
-- Check view accessibility and record counts
SELECT COUNT(*) as total_items FROM v_mi1ra_2;

-- Verify key fields are populated
SELECT 
    COUNT(*) as total_records,
    COUNT(prod_id) as with_prod_id,
    COUNT(vendor_id) as with_vendor,
    COUNT(logi_loc) as with_location
FROM v_mi1ra_2;

-- Sample data verification
SELECT prod_id, cust_pref_vendor, brand, descrip, vendor_id, area
FROM v_mi1ra_2 
WHERE ROWNUM <= 10;
```

#### Test Data Transformations
```sql
-- Verify pack size formatting logic
SELECT 
    prod_id,
    pack,
    prod_size,
    prod_size_unit,
    CASE 
        WHEN length(trim(prod_size)||trim(prod_size_unit)) > 6 
        THEN TRIM(pack)||'/'||trim(prod_size)||trim(prod_size_unit)
        ELSE LPAD(LTRIM(pack),4,' ')||'/'||trim(prod_size)||trim(prod_size_unit)
    END as formatted_pack_size
FROM v_mi1ra_2 
WHERE ROWNUM <= 5;

-- Check vendor logic (RDC vs standard vendor)
SELECT 
    prod_id,
    vendor_id as pm_vendor,
    rdc_vendor_id,
    DECODE(rdc_vendor_id, NULL, vendor_id, rdc_vendor_id) as final_vendor
FROM v_mi1ra_2 
WHERE rdc_vendor_id IS NOT NULL
AND ROWNUM <= 5;
```

#### Inventory Data Validation
```sql
-- Verify on-order quantities
SELECT 
    prod_id,
    cases_on_order,
    splits_on_order,
    (NVL(cases_on_order,0) + NVL(splits_on_order,0)) as total_on_order
FROM v_mi1ra_2 
WHERE (cases_on_order > 0 OR splits_on_order > 0)
AND ROWNUM <= 10;

-- Check AWM and pick frequency data
SELECT 
    prod_id,
    awm,
    pick_freq,
    spc
FROM v_mi1ra_2 
WHERE awm > 0 OR pick_freq > 0
AND ROWNUM <= 10;
```

### 2. Report Execution Validation

#### Command Line Testing
```bash
# Basic report execution (if accessible)
cd rpts/inv
./mi1ra -o output_file.rpt

# Check for successful completion
echo $?  # Should return 0 for success
```

#### Output File Verification
1. **File Creation**: Verify report file is generated
2. **Header Information**: Check report title, date, user ID
3. **Data Formatting**: Verify column alignment and data truncation
4. **Record Counts**: Compare detail line count with database query results
5. **Footer Information**: Check for "End of Report" indicator

### 3. Data Consistency Checks

#### Cross-Reference Validation
```sql
-- Verify PM table consistency
SELECT COUNT(*) 
FROM pm p
WHERE EXISTS (
    SELECT 1 FROM v_mi1ra_2 v 
    WHERE v.prod_id = p.prod_id 
    AND v.cust_pref_vendor = p.cust_pref_vendor
);

-- Check location data integrity  
SELECT COUNT(*)
FROM v_mi1ra_2 v
WHERE v.logi_loc IS NOT NULL
AND EXISTS (
    SELECT 1 FROM loc l 
    WHERE l.logi_loc = v.logi_loc
    AND l.prod_id = v.prod_id
);
```

#### Area and Location Validation
```sql
-- Verify area assignments
SELECT DISTINCT area, COUNT(*) 
FROM v_mi1ra_2 
GROUP BY area 
ORDER BY area;

-- Check for missing location data
SELECT COUNT(*) as items_without_location
FROM v_mi1ra_2 
WHERE logi_loc IS NULL;
```

## Common Issues and Troubleshooting

### Database Issues
1. **View Not Found**: Verify `v_mi1ra_2` view exists and is accessible
2. **Missing Data**: Check if underlying tables (pm, loc, inv) have recent data
3. **Performance Issues**: Monitor view execution time for large datasets

### Report Generation Issues
1. **Compilation Errors**: Verify Oracle Pro*C environment setup
2. **Missing Dependencies**: Ensure `report_util.c` library is available
3. **Output Formatting**: Check for character encoding issues in output

### Data Quality Issues
1. **Truncated Descriptions**: Verify 27-character limit in description field
2. **Missing Vendor Data**: Check RDC vendor ID logic for null handling
3. **Pack Size Format**: Verify pack size concatenation logic

## SQL Validation Queries for Testing

### Comprehensive Data Verification
```sql
-- Complete data validation query
SELECT 
    'Total Records' as metric,
    COUNT(*) as value
FROM v_mi1ra_2
UNION ALL
SELECT 
    'Records with Locations',
    COUNT(*)
FROM v_mi1ra_2 
WHERE logi_loc IS NOT NULL
UNION ALL
SELECT 
    'Records with On-Order Qty',
    COUNT(*)
FROM v_mi1ra_2 
WHERE NVL(cases_on_order,0) + NVL(splits_on_order,0) > 0
UNION ALL
SELECT 
    'Unique Product Count',
    COUNT(DISTINCT prod_id||cust_pref_vendor)
FROM v_mi1ra_2;
```

### Performance Testing Query
```sql
-- Execution time test
SET TIMING ON;
SELECT COUNT(*), 
       MIN(prod_id), 
       MAX(prod_id)
FROM v_mi1ra_2;
```

## Build and Deployment

### Makefile Integration
The report is integrated into the SWMS build system:
- **Source**: `MI1RA_SRCS = mi1ra.pc`
- **Objects**: `MI1RA_OBJS = mi1ra.o`  
- **Dependencies**: `report_util.o`, `ora_retrv_cond.o`, `globalisation.o`

### Compilation Steps
1. Pro*C precompilation: `mi1ra.pc → mi1ra.c`
2. C compilation: `mi1ra.c → mi1ra.o`
3. Linking with libraries: `mi1ra.o + dependencies → mi1ra`

## Conclusion

The MI1RA Item Overview Report is a critical component of the SWMS inventory management system, providing comprehensive item information combining product master data, location details, and inventory quantities. Proper validation requires testing both the underlying database view and the report generation process to ensure data accuracy and report functionality.

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Prepared For**: QA Engineering Team  
**Report System**: SWMS (Sysco Warehouse Management System)
