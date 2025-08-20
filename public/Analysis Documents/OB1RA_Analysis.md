# OB1RA Report - Comprehensive Analysis and Validation Guide

## Table of Contents
- [Report Overview](#report-overview)
- [Technical Architecture](#technical-architecture)
- [Data Sources and Dependencies](#data-sources-and-dependencies)
- [Business Logic Analysis](#business-logic-analysis)
- [Validation Guide for QA Engineers](#validation-guide-for-qa-engineers)
- [SQL Validation Queries](#sql-validation-queries)
- [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)
- [Enhancement History](#enhancement-history)

---

## Report Overview

### Purpose
The **OB1RA (Outbound Checkoff Report)** is a critical SWMS report that provides detailed information about outbound order selection activities. It serves as a checkoff document for warehouse operators to verify and track picked items during the order fulfillment process.

### Key Functions
- **Order Selection Tracking**: Lists all items to be picked for outbound orders
- **Float Management**: Organizes items by float sequences and zones
- **Inventory Verification**: Provides detailed item information for picking validation
- **Labor Management**: Integrates with labor tracking systems for performance monitoring
- **Quality Control**: Serves as a verification document during order processing

### Report Components
1. **Header Information**: Date, time, user, company information
2. **Float Details**: Float sequence, zone, batch information
3. **Item Details**: Product information, quantities, locations
4. **Customer Information**: Stop numbers, customer details
5. **Summary Totals**: Aggregated quantities by temperature zone

---

## Technical Architecture

### Source Files
- **Main Program**: `rpts/ord/ob1ra.pc` (Oracle Pro*C)
- **Utility Library**: `rpts/lib/ob1ra_util.c` (C functions)
- **Database View**: `schema/views/v_ob1ra.sql` (Oracle view)

### Programming Language
- **Oracle Pro*C**: Embedded SQL in C for database interactions
- **C Language**: Standard C functions for report formatting and utilities

### Database Integration
- **Primary View**: `V_OB1RA` - Joins multiple tables to provide comprehensive order data
- **Tables Involved**:
  - `floats` - Float information
  - `float_detail` - Detailed item allocations
  - `route` - Route and truck information
  - `ordm` - Order master data
  - `ordd` - Order detail data
  - `pm` - Product master
  - `sel_method` - Selection method configuration

---

## Data Sources and Dependencies

### Core Database View (V_OB1RA)
The report relies on the `V_OB1RA` view which aggregates data from multiple tables:

```sql
-- Primary data sources
FROM sel_method sm, ordd od, ordm om, route r, pm,
     float_detail fd, floats f
WHERE f.merge_loc like '???%'
  AND fd.float_no = f.float_no
  AND fd.qty_alloc > 0
  AND pm.prod_id = fd.prod_id
  AND pm.cust_pref_vendor = fd.cust_pref_vendor
  AND r.route_no = f.route_no
  AND om.order_id = fd.order_id
  AND od.order_id = fd.order_id
  AND od.order_line_id = fd.order_line_id
  AND sm.method_id = r.method_id
  AND sm.group_no = f.group_no
```

### Key Data Elements
- **Organizational**: Company code, truck number, route information
- **Customer**: Customer ID, customer name, stop number
- **Product**: Item ID, description, brand, manufacturer SKU
- **Quantity**: Case/split quantities, cube calculations
- **Location**: Source location, zone, sequence information
- **Operational**: Batch numbers, float sequences, selection methods

### System Parameters
The report reads several system configuration parameters:
- `START_FLOAT_CH`: Starting character for float sequences
- `CHECK_OFF_BREAK`: Checkoff break configuration
- `CHECK_OFF_BREAK_METHOD_ID`: Method IDs for checkoff breaks
- `LBR_MGMT_FLAG`: Labor management integration flag
- `LENGTH_UNIT`: Measurement units (IN/CM)

---

## Business Logic Analysis

### Sorting and Grouping Logic
The report uses sophisticated sorting to optimize picking efficiency:

```sql
ORDER BY lpad(ltrim(rtrim(truck_no)),3,'0'),
         decode(comp_code,'F',1,'C',2,'D',3,4),batch_no,
         to_number(substr(float_seq,2)),stop_no desc,
         batch_seq,zone desc,src_loc
```

**Sorting Priority**:
1. **Truck Number** (zero-padded)
2. **Company Code** (Freezer=1, Cooler=2, Dry=3, Other=4)
3. **Batch Number**
4. **Float Sequence** (numeric portion)
5. **Stop Number** (descending)
6. **Batch Sequence**
7. **Zone** (descending)
8. **Source Location**

### Quantity Calculations
The view handles different unit of measure (UOM) scenarios:

```sql
-- Case/Split quantity calculation
floor(decode(fd.uom,1,nvl(fd.qty_alloc,0),
             nvl(fd.qty_alloc,0)/nvl(pm.spc,1))) cs_sp_qty,
decode(fd.uom,1,'SP','CS') cs_sp,

-- Cube calculations
round(decode(fd.uom,1,nvl(pm.case_cube,0)/nvl(pm.spc,1),
                     nvl(pm.case_cube,0)),2) cs_sp_cube,

-- Weight calculations
round(nvl(pm.g_weight,0)*(nvl(fd.qty_alloc,0)),2) weight
```

### Pack Size Enhancement (SCE057)
The report includes concatenated pack size with units:
```sql
decode(fd.uom,1,'ONLY',
  lpad(nvl(rtrim(nvl(pm.pack,' ')),' '),4))||'/'||trim(pm.prod_size)||trim(prod_size_unit)
  pack_size
```

### Internationalization Support
- Supports French language conversion
- Metric/Imperial unit conversion for Ireland (CM vs IN)
- Expanded customer ID field (10 characters for SCE042)
- Globalization functions for report labels

---

## Validation Guide for QA Engineers

### Pre-Validation Setup
1. **Environment Verification**
   - Ensure SQLcl is available and configured
   - Verify database connectivity to SWMS schema
   - Confirm user has appropriate read permissions

2. **Test Data Requirements**
   - Active routes with generated floats
   - Allocated float_detail records
   - Valid product master data
   - Configured system parameters

### Step-by-Step Validation Process

#### Step 1: Data Integrity Validation
Verify that the underlying data is consistent and complete.

#### Step 2: Report Content Validation
Generate the report and verify each section matches expected data.

#### Step 3: Sorting and Grouping Validation
Confirm that data appears in the correct order according to business rules.

#### Step 4: Calculation Validation
Verify all quantity, cube, and weight calculations are accurate.

#### Step 5: Cross-Reference Validation
Compare report data with source tables to ensure accuracy.

### Test Scenarios

#### Scenario 1: Standard Order Processing
- **Purpose**: Validate normal order selection flow
- **Setup**: Create orders with case and split quantities
- **Expected**: Report shows correct quantities and locations

#### Scenario 2: Multi-Temperature Orders
- **Purpose**: Verify freezer/cooler/dry zone handling
- **Setup**: Orders spanning multiple temperature zones
- **Expected**: Proper sorting by temperature priority

#### Scenario 3: International Configuration
- **Purpose**: Test metric vs imperial units
- **Setup**: Configure LENGTH_UNIT parameter
- **Expected**: Correct unit display and cube formatting

#### Scenario 4: Extended Customer ID (SCE042)
- **Purpose**: Verify 10-character customer ID support
- **Setup**: Orders with extended customer IDs
- **Expected**: Full customer ID display without truncation

#### Scenario 5: Pack Size Units (SCE057)
- **Purpose**: Validate pack size unit concatenation
- **Setup**: Items with various pack sizes and units
- **Expected**: Proper pack/size/unit formatting

---

## SQL Validation Queries

### Query 1: Basic Report Data Validation
```sql
-- Validate core report data matches V_OB1RA view
SELECT 
    comp_code,
    truck_no,
    stop_no,
    cust_id,
    cust_name,
    batch_no,
    float_seq,
    zone,
    cs_sp_qty,
    cs_sp,
    pack_size,
    prod_id,
    src_loc,
    cs_sp_cube,
    seq
FROM v_ob1ra
WHERE route_no = '&ROUTE_NUMBER'
ORDER BY lpad(ltrim(rtrim(truck_no)),3,'0'),
         decode(comp_code,'F',1,'C',2,'D',3,4),batch_no,
         to_number(substr(float_seq,2)),stop_no desc,
         batch_seq,zone desc,src_loc;
```

### Query 2: Quantity Calculation Verification
```sql
-- Verify quantity calculations are correct
SELECT 
    fd.prod_id,
    fd.uom,
    fd.qty_alloc,
    pm.spc,
    -- Case/Split quantity calculation
    floor(decode(fd.uom,1,nvl(fd.qty_alloc,0),
                 nvl(fd.qty_alloc,0)/nvl(pm.spc,1))) as calculated_cs_sp_qty,
    -- Compare with view result
    v.cs_sp_qty,
    -- Cube calculation
    round(decode(fd.uom,1,nvl(pm.case_cube,0)/nvl(pm.spc,1),
                         nvl(pm.case_cube,0)),2) as calculated_cube,
    v.cs_sp_cube
FROM float_detail fd,
     pm,
     v_ob1ra v
WHERE fd.prod_id = pm.prod_id
  AND fd.cust_pref_vendor = pm.cust_pref_vendor
  AND fd.prod_id = v.prod_id
  AND fd.cust_pref_vendor = v.cust_pref_vendor
  AND fd.float_no = v.float_no
  AND rownum <= 10;
```

### Query 3: Sorting Order Validation
```sql
-- Verify sorting matches business rules
SELECT 
    truck_no,
    comp_code,
    batch_no,
    float_seq,
    stop_no,
    zone,
    src_loc,
    -- Show numeric sort key for float_seq
    to_number(substr(float_seq,2)) as float_sort_key,
    -- Show sort priority for comp_code
    decode(comp_code,'F',1,'C',2,'D',3,4) as comp_sort_priority
FROM v_ob1ra
WHERE route_no = '&ROUTE_NUMBER'
ORDER BY lpad(ltrim(rtrim(truck_no)),3,'0'),
         decode(comp_code,'F',1,'C',2,'D',3,4),batch_no,
         to_number(substr(float_seq,2)),stop_no desc,
         batch_seq,zone desc,src_loc;
```

### Query 4: System Parameter Validation
```sql
-- Verify system parameters are correctly configured
SELECT 
    application_func,
    config_flag_name,
    config_flag_val,
    config_flag_desc
FROM sys_config
WHERE config_flag_name IN (
    'START_FLOAT_CH',
    'CHECK_OFF_BREAK',
    'CHECK_OFF_BREAK_METHOD_ID',
    'LENGTH_UNIT'
)
OR (application_func = 'LABOR MGMT' AND config_flag_name = 'LBR_MGMT_FLAG');
```

### Query 5: Pack Size Format Validation (SCE057)
```sql
-- Verify pack size formatting with units
SELECT 
    pm.prod_id,
    pm.pack,
    pm.prod_size,
    pm.prod_size_unit,
    fd.uom,
    -- Expected pack size calculation
    decode(fd.uom,1,'ONLY',
      lpad(nvl(rtrim(nvl(pm.pack,' ')),' '),4))||'/'||trim(pm.prod_size)||trim(pm.prod_size_unit)
    ) as calculated_pack_size,
    v.pack_size as view_pack_size
FROM pm,
     float_detail fd,
     v_ob1ra v
WHERE pm.prod_id = fd.prod_id
  AND pm.cust_pref_vendor = fd.cust_pref_vendor
  AND pm.prod_id = v.prod_id
  AND fd.float_no = v.float_no
  AND rownum <= 10;
```

### Query 6: Customer ID Length Validation (SCE042)
```sql
-- Verify customer ID field can handle 10 characters
SELECT 
    om.cust_id,
    length(om.cust_id) as cust_id_length,
    om.cust_name
FROM ordm om,
     float_detail fd,
     v_ob1ra v
WHERE om.order_id = fd.order_id
  AND fd.prod_id = v.prod_id
  AND fd.float_no = v.float_no
  AND length(om.cust_id) > 7  -- Show extended customer IDs
  AND rownum <= 10;
```

### Query 7: Zone and Temperature Validation
```sql
-- Verify zone handling and temperature sorting
SELECT 
    f.route_no,
    f.truck_no,
    f.comp_code,
    CASE f.comp_code 
        WHEN 'F' THEN 'FREEZER'
        WHEN 'C' THEN 'COOLER'
        WHEN 'D' THEN 'DRY'
        ELSE 'OTHER'
    END as temperature_zone,
    fd.zone,
    count(*) as item_count,
    sum(fd.qty_alloc) as total_qty
FROM floats f,
     float_detail fd
WHERE f.float_no = fd.float_no
  AND f.route_no = '&ROUTE_NUMBER'
GROUP BY f.route_no, f.truck_no, f.comp_code, fd.zone
ORDER BY f.truck_no, 
         decode(f.comp_code,'F',1,'C',2,'D',3,4),
         fd.zone desc;
```

### Query 8: Data Completeness Check
```sql
-- Identify any missing or null critical fields
SELECT 
    'Missing Product' as issue_type,
    count(*) as record_count
FROM v_ob1ra
WHERE prod_id IS NULL
UNION ALL
SELECT 
    'Missing Customer',
    count(*)
FROM v_ob1ra  
WHERE cust_id IS NULL
UNION ALL
SELECT 
    'Missing Quantities',
    count(*)
FROM v_ob1ra
WHERE cs_sp_qty IS NULL OR cs_sp_qty = 0
UNION ALL
SELECT 
    'Missing Source Location',
    count(*)
FROM v_ob1ra
WHERE src_loc IS NULL;
```

### Query 9: Float Detail Allocation Validation
```sql
-- Verify all float detail records have proper allocations
SELECT 
    f.route_no,
    f.float_no,
    f.float_seq,
    count(fd.seq_no) as detail_count,
    sum(fd.qty_alloc) as total_allocated,
    sum(case when fd.qty_alloc > 0 then 1 else 0 end) as positive_alloc_count,
    sum(case when fd.qty_alloc <= 0 then 1 else 0 end) as zero_or_neg_alloc_count
FROM floats f,
     float_detail fd
WHERE f.float_no = fd.float_no
  AND f.route_no = '&ROUTE_NUMBER'
GROUP BY f.route_no, f.float_no, f.float_seq
ORDER BY f.float_seq;
```

### Query 10: Report Performance Check
```sql
-- Check performance and record counts
SELECT 
    'Total Records' as metric,
    count(*) as value
FROM v_ob1ra
WHERE route_no = '&ROUTE_NUMBER'
UNION ALL
SELECT 
    'Unique Floats',
    count(distinct float_no)
FROM v_ob1ra
WHERE route_no = '&ROUTE_NUMBER'
UNION ALL
SELECT 
    'Unique Products',
    count(distinct prod_id)
FROM v_ob1ra
WHERE route_no = '&ROUTE_NUMBER'
UNION ALL
SELECT 
    'Unique Customers',
    count(distinct cust_id)
FROM v_ob1ra
WHERE route_no = '&ROUTE_NUMBER';
```

---

## Common Issues and Troubleshooting

### Issue 1: Missing Records in Report
**Symptoms**: Expected items don't appear in the report
**Possible Causes**:
- Float detail records have zero allocation (`qty_alloc = 0`)
- Merge location filter doesn't match (`merge_loc not like '???%'`)
- Missing product master data
- Float not properly generated

**Validation Query**:
```sql
-- Check for excluded records
SELECT 
    fd.float_no,
    fd.prod_id,
    fd.qty_alloc,
    f.merge_loc,
    pm.prod_id as pm_exists
FROM float_detail fd,
     floats f,
     pm
WHERE fd.float_no = f.float_no
  AND fd.prod_id = pm.prod_id(+)
  AND fd.cust_pref_vendor = pm.cust_pref_vendor(+)
  AND f.route_no = '&ROUTE_NUMBER'
  AND (fd.qty_alloc <= 0 OR f.merge_loc not like '???%' OR pm.prod_id IS NULL);
```

### Issue 2: Incorrect Sorting
**Symptoms**: Items appear out of expected sequence
**Possible Causes**:
- Float sequence formatting issues
- Zone data inconsistencies
- Null values in sort fields

**Validation Query**:
```sql
-- Check sort field integrity
SELECT 
    truck_no,
    float_seq,
    substr(float_seq,2) as seq_substring,
    case when regexp_like(substr(float_seq,2), '^[0-9]+$') then 'NUMERIC' else 'NON-NUMERIC' end as seq_type,
    zone,
    src_loc
FROM v_ob1ra
WHERE route_no = '&ROUTE_NUMBER'
  AND (truck_no IS NULL OR float_seq IS NULL OR zone IS NULL)
ORDER BY float_seq;
```

### Issue 3: Calculation Discrepancies
**Symptoms**: Quantities or cubes don't match expected values
**Possible Causes**:
- SPC (splits per case) data issues
- UOM (unit of measure) inconsistencies
- Product master data problems

**Validation Query**:
```sql
-- Check calculation components
SELECT 
    fd.prod_id,
    fd.uom,
    fd.qty_alloc,
    pm.spc,
    pm.case_cube,
    pm.g_weight,
    case when pm.spc IS NULL OR pm.spc = 0 then 'SPC_ISSUE' else 'OK' end as spc_status
FROM float_detail fd,
     pm
WHERE fd.prod_id = pm.prod_id
  AND fd.cust_pref_vendor = pm.cust_pref_vendor
  AND fd.float_no IN (SELECT float_no FROM floats WHERE route_no = '&ROUTE_NUMBER')
  AND (pm.spc IS NULL OR pm.spc = 0);
```

### Issue 4: Performance Problems
**Symptoms**: Report takes too long to generate
**Possible Causes**:
- Missing or inefficient indexes
- Large data volumes
- Complex view joins

**Performance Check**:
```sql
-- Check table sizes and join efficiency
SELECT 
    table_name,
    num_rows,
    last_analyzed
FROM user_tables
WHERE table_name IN ('FLOATS', 'FLOAT_DETAIL', 'PM', 'ORDM', 'ORDD', 'ROUTE', 'SEL_METHOD')
ORDER BY num_rows desc;
```

---

## Enhancement History

### Major Modifications

#### DN2986 (1994): CPV Addition and Sequence Changes
- Added Customer Preferred Vendor (CPV) to select statements
- Replaced page_seq with seq throughout the program
- Adjusted field widths to accommodate CPV
- Modified host variables and display formats

#### D#6775 (1995): Zone Sorting Enhancement
- Changed sort order to freezer, dry, cooler priority
- Improved picking efficiency through temperature-based sequencing

#### D#7253 (1995): Oracle 7 Compatibility
- Rewrote statements for Oracle 7 environment compatibility
- Enhanced SQL statement structure

#### DN12554 (2010): 212 Legacy Enhancements
- **SCE042**: Expanded customer ID from 7 to 10 characters
- **SCE057**: Added UOM field support, expanded pack size display
- Enhanced prod_size_unit concatenation

#### Charm# 6000003789 (2014): Ireland Metric Conversion
- Increased cube field display from 6 to 8 digits
- Changed data types from float to double for precision
- Added metric unit support (CM vs IN)

#### SWMS Globalization (2013): French Conversion
- Added multi-language support
- Implemented report label translation
- Enhanced internationalization functions

### Current Version Features
- Support for extended customer IDs (10 characters)
- Pack size with unit concatenation
- Metric/Imperial unit conversion
- Multi-language label support
- Enhanced cube precision
- Labor management integration
- Configurable system parameters

---

## Conclusion

The OB1RA report is a sophisticated and critical component of the SWMS order processing system. This validation guide provides QA engineers with comprehensive tools and queries to ensure report accuracy, performance, and reliability. Regular validation using these procedures will help maintain data integrity and support efficient warehouse operations.

For additional support or questions about specific validation scenarios, refer to the SWMS documentation or contact the development team.

---

**Document Version**: 1.0  
**Last Updated**: Generated from source code analysis  
**Scope**: SWMS OB1RA Report Validation and Analysis
