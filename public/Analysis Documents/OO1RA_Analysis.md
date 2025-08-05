# OO1RA Short Order Report Analysis Document

## Overview

The OO1RA report is a **Short Order Report** within the SWMS (Sysco Warehouse Management System) that provides comprehensive order information for shipped orders. This report displays order details with a focus on cases and splits quantities for both ordered and shipped amounts, making it essential for order verification and fulfillment analysis.

### Report Summary
- **Report ID**: OO1RA
- **Report Name**: Short Order Report
- **Purpose**: Displays detailed order information showing ordered vs. shipped quantities in cases and splits format
- **Source File**: `rpts/ord/oo1ra.pc` (445 lines)
- **Database View**: `v_oo1ra`
- **Report Library**: Uses `report_util.c` framework with globalization support

### Business Purpose
The OO1RA report serves multiple critical business functions:
- **Order Verification**: Validates shipped quantities against ordered quantities
- **Customer Service**: Provides detailed breakdown of what was ordered vs. what was shipped
- **Inventory Management**: Shows product locations and sequence information for order fulfillment
- **Quality Control**: Enables verification of order accuracy and completeness
- **Documentation**: Creates audit trail for order fulfillment activities

## Technical Architecture

### Programming Environment
- **Language**: C with embedded SQL (Oracle Pro*C)
- **Compiler**: Oracle Pro*C precompiler
- **Database**: Oracle with SWMS schema
- **Framework**: SWMS reporting utilities with globalization support

### File Structure
```
rpts/ord/oo1ra.pc           # Main report source (445 lines)
schema/views/v_oo1ra.sql    # Primary data view
rpts/lib/report_util.c      # Shared reporting utilities
makefile                    # Build configuration
```

## Code Files Analyzed

### Primary Source: oo1ra.pc
The main report implementation contains:
- **SQL Construction**: Dynamic query building with selection criteria
- **Data Formatting**: Complex quantity calculations for cases and splits
- **Location Logic**: Product location determination from inventory
- **Page Management**: Truck-based page breaking functionality
- **Globalization**: Multi-language field label support

### Database View: v_oo1ra.sql
The view provides order data by joining:
- **PM**: Product Master information
- **ORDD**: Order Detail records
- **ORDM**: Order Master records  
- **ROUTE**: Route information

### Key Database Schema Components

#### Core Tables
- **ORDD** (Order Detail): Primary order line items with quantities
- **ORDM** (Order Master): Order header information with customer details
- **PM** (Product Master): Product specifications including SPC (Sales Per Case)
- **ROUTE** (Route): Route and scheduling information
- **LOC** (Location): Product location and picking information

#### Key Fields Retrieved
```sql
-- Order Information
d.order_id, d.order_line_id, d.cust_pref_vendor, d.uom, d.seq

-- Quantity Information  
d.qty_ordered AS qty_expected, d.qty_alloc AS qty

-- Product Information
d.prod_id, p.descrip, p.spc

-- Route Information
m.truck_no, m.route_no, m.stop_no, m.cust_id, m.cust_name

-- Scheduling Information
r.sch_time, r.method_id, r.status, r.route_batch_no
```

## Report Processing Logic

### Dynamic SQL Construction
The report builds SQL statements with conditional WHERE clauses:

```sql
-- Base Query Components
MASTER_STMT: "select truck_no,stop_no,cust_id,cust_name,order_id,prod_id,cust_pref_vendor,descrip,uom,qty_expected,qty,seq,spc"
FROM_STMT: "from v_oo1ra"  
ORDER_STMT: "order by 1,2,4,5,6"
```

### Key Processing Features

#### 1. Quantity Calculations
The report performs complex calculations to convert quantities into cases and splits:

**Cases Ordered Logic:**
```c
sprintf(c_qty_expt_cases[i], "%*ld", detail_item_width[8],
    (qty_expected[i] <= 0) ? 0 : (spc[i] <= 0) ? qty_expected[i] :
    (uom[i] == 0) ? qty_expected[i] / spc[i] :
    (uom[i] == 2) ? qty_expected[i] / spc[i] :
    (uom[i] == 1) ? qty_expected[i] : qty_expected[i]);
```

**Splits Ordered Logic:**
```c
sprintf(c_qty_expt_splits[i], "%*ld", detail_item_width[9],
    (qty_expected[i] <= 0) ? 0 : (spc[i] <= 0) ? 0 :
    (uom[i] == 1) ? qty_expected[i] % spc[i] :
    (uom[i] == 2) ? 0 :
    (uom[i] == 0) ? 0 : 0);
```

#### 2. Location Determination
For each product, the report determines the pick location:

```sql
SELECT logi_loc
  INTO :tmp_loc
  FROM loc l
 WHERE prod_id = :tmp_prod
   AND cust_pref_vendor = :tmp_cpv
   AND perm = 'Y'
   AND rank = 1
   AND ((l.uom = :tmp_uom) or (l.uom in (0,2) and :tmp_uom in (0,2)));
```

#### 3. Page Breaking Logic
The report implements truck-based page breaking:
- New page starts when truck number changes (first 5 characters)
- Page breaks also occur when line count reaches `DETAIL_LENGTH` (35 lines)

#### 4. Customer Preferred Vendor Formatting
Special handling for CPV display:
```c
if(!(strncmp(cpv[i],"-", 1)))
    detail_item[i].item[6] = BLANKS;
else
    detail_item[i].item[6] = cpv[i];
```

## Report Output Structure

### Column Layout
The report displays information in the following columns:

| Column | Width | Description | Sample Data |
|--------|-------|-------------|-------------|
| **Truck** | 10 | Truck number | 1234 |
| **Stop** | 5 | Stop number | 1 |
| **Customer_no** | 10 | Customer ID | 123456 |
| **Name** | 20 | Customer name | ACME FOODS |
| **Order_no** | 9 | Order number | ORD123456 |
| **Item_no** | 7 | Product ID | 1234567 |
| **CPV** | 4 | Customer Preferred Vendor | SYSC |
| **Description** | 15 | Product description | PIZZA PEPPERONI |
| **Cases (Ordered)** | 5 | Cases ordered | 12 |
| **Spl (Ordered)** | 3 | Splits ordered | 3 |
| **Cases (Shipped)** | 5 | Cases shipped | 12 |
| **Spl (Shipped)** | 3 | Splits shipped | 3 |
| **Location** | 8 | Pick location | A01A01 |
| **Seq** | 8 | Sequence number | 001 |

### Header Information
- Report title: "Short Order Report"
- Date/time and user information
- Column headers with globalized labels
- Ordered/Shipped sub-headers

## Validation Steps for QA Engineers

### 1. Database Validation Queries

#### Verify Core Data Sources
```sql
-- Check view accessibility and record counts
SELECT COUNT(*) as total_orders FROM v_oo1ra;

-- Verify order status distribution
SELECT status, COUNT(*) as count 
FROM route r, ordm m
WHERE r.route_no = m.route_no
AND EXISTS (SELECT 1 FROM v_oo1ra v WHERE v.route_no = r.route_no)
GROUP BY status 
ORDER BY status;

-- Check UOM distribution
SELECT uom, COUNT(*) as count
FROM v_oo1ra 
GROUP BY uom 
ORDER BY uom;

-- Sample data verification
SELECT truck_no, stop_no, cust_id, cust_name, order_id, 
       prod_id, cust_pref_vendor, qty_expected, qty
FROM v_oo1ra 
WHERE ROWNUM <= 10;
```

#### Test View Data Integrity
```sql
-- Verify shipped order status requirement
SELECT COUNT(*) as shipped_orders
FROM v_oo1ra v, ordd d 
WHERE v.order_id = d.order_id 
AND v.order_line_id = d.order_line_id
AND d.status = 'SHT';

-- Check product master consistency
SELECT COUNT(*) as pm_matches
FROM v_oo1ra v
WHERE EXISTS (
    SELECT 1 FROM pm p 
    WHERE p.prod_id = v.prod_id
    AND p.cust_pref_vendor = v.cust_pref_vendor
);

-- Verify route relationships
SELECT COUNT(*) as route_matches
FROM v_oo1ra v
WHERE EXISTS (
    SELECT 1 FROM route r 
    WHERE r.route_no = v.route_no
);
```

#### Validate Quantity Calculations
```sql
-- Test case/split calculations
SELECT 
    v.prod_id,
    v.qty_expected,
    v.qty,
    v.uom,
    v.spc,
    -- Expected cases calculation
    CASE 
        WHEN v.qty_expected <= 0 THEN 0
        WHEN NVL(v.spc,0) <= 0 THEN v.qty_expected
        WHEN v.uom = 0 THEN v.qty_expected / v.spc
        WHEN v.uom = 2 THEN v.qty_expected / v.spc
        WHEN v.uom = 1 THEN v.qty_expected
        ELSE v.qty_expected
    END as calculated_cases_ordered,
    -- Expected splits calculation
    CASE
        WHEN v.qty_expected <= 0 THEN 0
        WHEN NVL(v.spc,0) <= 0 THEN 0
        WHEN v.uom = 1 THEN MOD(v.qty_expected, v.spc)
        ELSE 0
    END as calculated_splits_ordered
FROM v_oo1ra v
WHERE ROWNUM <= 5;
```

#### Check Customer Preferred Vendor Logic
```sql
-- Test CPV formatting logic
SELECT 
    prod_id,
    cust_pref_vendor,
    CASE 
        WHEN cust_pref_vendor = '-' THEN ' '
        ELSE cust_pref_vendor
    END as formatted_cpv
FROM v_oo1ra 
WHERE ROWNUM <= 10;
```

### 2. Location Validation Queries

#### Verify Product Location Logic
```sql
-- Test location determination query
SELECT 
    v.prod_id,
    v.cust_pref_vendor,
    v.uom,
    l.logi_loc,
    l.perm,
    l.rank,
    l.uom as loc_uom
FROM v_oo1ra v, loc l
WHERE l.prod_id = v.prod_id
AND l.cust_pref_vendor = v.cust_pref_vendor
AND l.perm = 'Y'
AND l.rank = 1
AND ((l.uom = v.uom) OR (l.uom IN (0,2) AND v.uom IN (0,2)))
AND ROWNUM <= 10;

-- Check for products without locations (will show as "Float")
SELECT COUNT(*) as floating_products
FROM v_oo1ra v
WHERE NOT EXISTS (
    SELECT 1 FROM loc l
    WHERE l.prod_id = v.prod_id
    AND l.cust_pref_vendor = v.cust_pref_vendor
    AND l.perm = 'Y'
    AND l.rank = 1
    AND ((l.uom = v.uom) OR (l.uom IN (0,2) AND v.uom IN (0,2)))
);
```

### 3. Report Execution Validation

#### Command Line Testing
```bash
# Basic report execution (if accessible)
cd rpts/ord
./oo1ra -o output_file.rpt

# Check for successful completion
echo $?  # Should return 0 for success
```

#### Page Breaking Validation
```sql
-- Test truck grouping for page breaks
SELECT 
    SUBSTR(truck_no,1,5) as truck_group,
    COUNT(*) as order_count
FROM v_oo1ra 
GROUP BY SUBSTR(truck_no,1,5)
ORDER BY truck_group;

-- Verify stop sequence within trucks
SELECT truck_no, stop_no, COUNT(*) as line_count
FROM v_oo1ra
GROUP BY truck_no, stop_no
ORDER BY truck_no, stop_no;
```

#### Output File Verification
1. **File Creation**: Verify report file is generated with correct naming
2. **Header Information**: Check report title "Short Order Report", date, user ID
3. **Column Headers**: Verify "Ordered" and "Shipped" sub-headers
4. **Page Breaks**: Verify page breaks occur on truck changes
5. **Data Formatting**: Check column alignment, quantity calculations
6. **Globalization**: Verify field labels use globalized text when configured
7. **Footer Information**: Check for "End of Report" indicator

### 4. Data Consistency Checks

#### Cross-Reference Validation
```sql
-- Verify ORDD table consistency
SELECT COUNT(*) as ordd_matches
FROM ordd d
WHERE EXISTS (
    SELECT 1 FROM v_oo1ra v 
    WHERE v.order_id = d.order_id
    AND v.order_line_id = d.order_line_id
    AND v.prod_id = d.prod_id
);

-- Check ORDM table consistency  
SELECT COUNT(*) as ordm_matches
FROM ordm m
WHERE EXISTS (
    SELECT 1 FROM v_oo1ra v 
    WHERE v.order_id = m.order_id
    AND v.route_no = m.route_no
    AND v.cust_id = m.cust_id
);

-- Verify route table consistency
SELECT COUNT(*) as route_matches
FROM route r
WHERE EXISTS (
    SELECT 1 FROM v_oo1ra v
    WHERE v.route_no = r.route_no
);
```

#### Quantity Validation
```sql
-- Check for negative quantities
SELECT COUNT(*) as negative_qty_expected
FROM v_oo1ra 
WHERE qty_expected < 0;

SELECT COUNT(*) as negative_qty_shipped
FROM v_oo1ra 
WHERE qty < 0;

-- Check for zero SPC values
SELECT COUNT(*) as zero_spc
FROM v_oo1ra 
WHERE NVL(spc,0) = 0;

-- Validate UOM values
SELECT uom, COUNT(*) as count
FROM v_oo1ra
WHERE uom NOT IN (0,1,2)
GROUP BY uom;
```

#### Order Status Validation
```sql
-- Verify only shipped orders are included
SELECT d.status, COUNT(*) as count
FROM v_oo1ra v, ordd d
WHERE v.order_id = d.order_id
AND v.order_line_id = d.order_line_id
GROUP BY d.status;

-- Should only show 'SHT' status
```

### 5. Business Logic Validation

#### Customer Information Validation
```sql
-- Check customer name consistency
SELECT COUNT(*) as cust_name_mismatches
FROM v_oo1ra v, ordm m
WHERE v.order_id = m.order_id
AND v.cust_name != m.cust_name;

-- Verify customer ID consistency
SELECT COUNT(*) as cust_id_mismatches  
FROM v_oo1ra v, ordm m
WHERE v.order_id = m.order_id
AND v.cust_id != m.cust_id;
```

#### Sequence Validation
```sql
-- Check sequence number format and values
SELECT seq, COUNT(*) as count
FROM v_oo1ra
WHERE LENGTH(TRIM(seq)) > 8 OR seq IS NULL
GROUP BY seq;

-- Verify sequence is numeric where expected
SELECT COUNT(*) as non_numeric_seq
FROM v_oo1ra 
WHERE NOT REGEXP_LIKE(TRIM(seq), '^[0-9]+$')
AND seq IS NOT NULL;
```

## Common Issues and Troubleshooting

### Database Issues
1. **View Performance**: Monitor v_oo1ra execution time with large datasets
2. **Missing Orders**: Check ORDD.STATUS - only 'SHT' (shipped) orders appear
3. **Route Status**: Verify route status allows order visibility

### Report Generation Issues
1. **Page Breaking Problems**: Check truck number consistency and format
2. **Quantity Calculation Errors**: Verify SPC (Sales Per Case) values in PM table
3. **Location Display Issues**: Check LOC table for permanent locations with rank 1
4. **Globalization Issues**: Ensure proper field count in init_globalisation calls

### Data Quality Issues
1. **Missing Customer Names**: Check ORDM.CUST_NAME population
2. **Incorrect CPV Display**: Verify Customer Preferred Vendor values
3. **Zero Quantities**: Check for legitimate zero quantity orders vs. data errors
4. **Missing Product Descriptions**: Verify PM.DESCRIP field population

## SQL Validation Queries for Testing

### Comprehensive Data Verification
```sql
-- Complete order validation summary
SELECT 
    'Total Orders' as metric,
    COUNT(*) as value
FROM v_oo1ra
UNION ALL
SELECT 
    'Shipped Orders Only',
    COUNT(*)
FROM v_oo1ra v, ordd d
WHERE v.order_id = d.order_id 
AND v.order_line_id = d.order_line_id
AND d.status = 'SHT'
UNION ALL
SELECT 
    'Orders with Locations',
    COUNT(*)
FROM v_oo1ra v
WHERE EXISTS (
    SELECT 1 FROM loc l
    WHERE l.prod_id = v.prod_id
    AND l.cust_pref_vendor = v.cust_pref_vendor
    AND l.perm = 'Y'
    AND l.rank = 1
)
UNION ALL
SELECT 
    'Orders with Valid SPC',
    COUNT(*)
FROM v_oo1ra
WHERE NVL(spc,0) > 0;
```

### Performance Testing Query
```sql
-- Execution time test with full ordering
SET TIMING ON;
SELECT COUNT(*), 
       MIN(truck_no), 
       MAX(truck_no),
       MIN(order_id),
       MAX(order_id)
FROM v_oo1ra
ORDER BY truck_no, stop_no, cust_name, order_id, prod_id;
```

### Data Quality Validation
```sql
-- Check for potential data quality issues
SELECT 
    'Records with NULL descriptions' as issue,
    COUNT(*) as count
FROM v_oo1ra 
WHERE descrip IS NULL
UNION ALL
SELECT 
    'Records with NULL customer names',
    COUNT(*)
FROM v_oo1ra 
WHERE cust_name IS NULL
UNION ALL
SELECT 
    'Records with NULL CPV',
    COUNT(*)
FROM v_oo1ra 
WHERE cust_pref_vendor IS NULL
UNION ALL
SELECT 
    'Records with NULL sequences',
    COUNT(*)
FROM v_oo1ra 
WHERE seq IS NULL;
```

## Build and Deployment

### Makefile Integration
The report is integrated into the SWMS build system:
- **Source**: `OO1RA_SRCS = oo1ra.pc`
- **Objects**: `OO1RA_OBJS = oo1ra.o`  
- **Dependencies**: `report_util.o`, `ora_retrv_cond.o`, `globalisation.o`

### Compilation Steps
1. Pro*C precompilation: `oo1ra.pc → oo1ra.c`
2. C compilation: `oo1ra.c → oo1ra.o`
3. Linking with libraries: `oo1ra.o + dependencies → oo1ra`

### Installation
- **Target Directory**: `$(REPORTSDIR)/oo1ra`
- **Install Target**: `install.oo1ra`

## Configuration Parameters

### Report Settings
- **Lines Per Page**: 35 items per page (DETAIL_LENGTH constant)
- **Page Breaking**: Automatic on truck number change (first 5 characters)
- **Field Lengths**: Configured via detail_title_width and detail_item_width arrays
- **Customer ID Length**: 10 characters (enhanced for SCE042)

### UOM (Unit of Measure) Values
- **0**: Cases (CS)
- **1**: Splits (SP) 
- **2**: Cases (CS) - alternate designation

## Conclusion

The OO1RA Short Order Report is a critical operational report that provides detailed order fulfillment information with sophisticated quantity calculations and location determination. The report's primary strength lies in its ability to display both ordered and shipped quantities in an easy-to-read cases/splits format, making it invaluable for order verification and customer service activities. 

Key validation focus areas should include:
- Quantity calculation accuracy (cases vs. splits)
- Location determination logic
- Page breaking functionality on truck changes
- Customer Preferred Vendor formatting
- Data consistency across order-related tables

The report's integration with globalization features and customer ID expansion demonstrates the system's adaptability to evolving business requirements while maintaining data integrity and presentation quality.

---

**Document Version**: 1.0  
**Last Updated**: August 2025  
**Prepared For**: QA Engineering Team  
**Report System**: SWMS (Sysco Warehouse Management System)
