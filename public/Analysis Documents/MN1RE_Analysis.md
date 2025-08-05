# MN1RE - Reserve Pallets More Than 90 Days Old Report
## Analysis and Validation Guide

### Overview

**MN1RE (Reserve Pallets More Than 90 Days Old Report)** is an Oracle SQL-based aging report within the Sysco Warehouse Management System (SWMS) that identifies license plates in reserve locations that have exceeded the 90-day aging threshold. This report serves as a critical tool for inventory management by highlighting potentially stale inventory in non-permanent locations that may require attention or disposition.

The report provides essential visibility into aged inventory by displaying detailed information about products, their storage locations, quantities, and aging metrics. It is organized by buyer to facilitate vendor management and includes comprehensive data elements to support inventory decision-making processes.

#### Purpose and Business Function
- **Inventory Aging Control**: Identifies reserve inventory exceeding 90-day thresholds
- **Vendor Management**: Groups results by buyer for supplier accountability  
- **Location Management**: Shows reserve (non-permanent) location assignments
- **Quantity Tracking**: Displays both case and split quantities with UOM awareness
- **Audit Compliance**: Provides aging documentation for regulatory requirements

#### Report Structure
The report displays inventory records sorted by buyer and product ID, showing:
- Product identification (ID, brand, description, manufacturer SKU)
- Customer Preferred Vendor (CPV) indicators
- License plate and location information  
- Quantity details (cases/splits) with UOM support
- Aging metrics (inventory date and days old)
- Vendor information for accountability

---

## Code Files Analyzed

### Primary Report File
- **File**: `rpts/inv/mn1re.sql`
- **Type**: Oracle SQL script with embedded formatting and globalization support
- **Purpose**: Main report execution script with column formatting and data retrieval

### Data Source Views
- **Primary View**: `v_mn1re` (defined in `schema/views/v_mn1re.sql`)
- **Secondary View**: `v_mn1rc` (referenced but provides broader inventory context)

### Supporting Components  
- **Globalization**: Integration with `global_report_dict` for multi-language support
- **Date Formatting**: Dynamic date format handling via `global_date_format`
- **Area Management**: Integration with `swms_areas` and `swms_sub_areas` hierarchy

---

## Technical Architecture

### Data Source Structure

#### V_MN1RE View Definition
The core data source uses the following table relationships:
```sql
SELECT DISTINCT i.logi_loc, p.buyer, i.prod_id, i.cust_pref_vendor,
       i.plogi_loc, i.qoh, i.inv_date, p.spc, p.descrip,
       l.aisle_side, i.status, i.inv_uom
FROM loc l, pm p, inv i
WHERE (sysdate - i.inv_date) > 90
  AND i.plogi_loc != i.logi_loc  -- Reserve location indicator
  AND i.plogi_loc = l.logi_loc
  AND i.prod_id = p.prod_id
  AND i.cust_pref_vendor = p.cust_pref_vendor
  AND l.perm = 'N'  -- Non-permanent (reserve) locations only
  AND EXISTS (SELECT 'x' FROM zone, lzone
              WHERE zone.rule_id != 1
                AND lzone.zone_id = zone.zone_id
                AND lzone.logi_loc = l.logi_loc)
```

#### Key Business Rules Implemented
1. **90-Day Threshold**: `(sysdate - i.inv_date) > 90`
2. **Reserve Locations Only**: `i.plogi_loc != i.logi_loc AND l.perm = 'N'`
3. **Zone Restrictions**: Excludes zones with rule_id = 1 (typically home slots)
4. **Active Inventory**: Shows current inventory regardless of status

### Report Output Columns

| Column | Description | Source | Format | Width |
|--------|-------------|--------|--------|-------|
| BUYER | Product buyer | pm.buyer | Text | Variable |
| PROD_ID | Product identifier | inv.prod_id | Text | 8 chars |
| CPV | Customer Preferred Vendor indicator | inv.cust_pref_vendor | Text | 10 chars |
| LOGI_LOC | License plate ID | inv.logi_loc | Text | 18 chars |
| PLOGI_LOC | Physical location | inv.plogi_loc | Text | 9 chars |
| INV_UOM | Unit of measure indicator | inv.inv_uom | Text | 5 chars |
| QOH_CASES | Quantity on hand in cases | Calculated | Numeric | 5 digits |
| QOH_SPLITS | Quantity on hand in splits | Calculated | Numeric | 5 digits |
| INV_DATE | Inventory date | inv.inv_date | Date | 9 chars |
| NO_OF_DAYS | Days since inventory date | Calculated | Numeric | Variable |
| DESCRIP | Product description | pm.descrip | Text | 30 chars |

---

## Validation Steps

### Step 1: Verify Report Data Source and Basic Counts

**Purpose**: Confirm the report is accessing the correct data and validate basic record counts.

**SQL Query**:
```sql
-- Validate basic data source
SELECT COUNT(*) as total_records,
       COUNT(DISTINCT buyer) as unique_buyers,
       COUNT(DISTINCT prod_id) as unique_products,
       MIN(ROUND(sysdate - inv_date, 0)) as min_days_old,
       MAX(ROUND(sysdate - inv_date, 0)) as max_days_old
FROM v_mn1re;
```

**Expected Results**:
- Total records should match the report row count
- All records should have days_old > 90
- Should have multiple buyers and products (unless warehouse has limited aged inventory)

**Validation Points**:
- Record count matches printed report
- Date calculations show all records exceed 90 days
- No null values in critical fields

---

### Step 2: Validate 90-Day Aging Logic

**Purpose**: Ensure all displayed records meet the 90-day aging criteria and verify date calculations.

**SQL Query**:
```sql
-- Verify aging logic and date calculations
SELECT buyer, prod_id, cust_pref_vendor, logi_loc, plogi_loc,
       inv_date,
       ROUND(sysdate - inv_date, 0) as days_old,
       CASE 
         WHEN ROUND(sysdate - inv_date, 0) > 90 THEN 'PASS'
         ELSE 'FAIL'
       END as age_test
FROM v_mn1re
WHERE ROUND(sysdate - inv_date, 0) <= 90;  -- Should return no records
```

**Expected Results**:
- Query should return zero records
- If any records returned, aging logic has failed

**Validation Points**:
- No records should be returned from this query
- All inventory dates should be more than 90 days old
- Date arithmetic should match report display

---

### Step 3: Verify Reserve Location Logic

**Purpose**: Confirm that only reserve (non-permanent) locations are included in the report.

**SQL Query**:
```sql
-- Validate reserve location criteria
SELECT DISTINCT l.logi_loc, l.perm, i.plogi_loc, i.logi_loc,
       CASE 
         WHEN i.plogi_loc != i.logi_loc THEN 'Reserve'
         ELSE 'Home'
       END as location_type,
       CASE 
         WHEN l.perm = 'N' THEN 'Non-Permanent'
         ELSE 'Permanent'
       END as perm_status
FROM inv i, loc l, pm p
WHERE i.plogi_loc = l.logi_loc
  AND i.prod_id = p.prod_id
  AND i.cust_pref_vendor = p.cust_pref_vendor
  AND (sysdate - i.inv_date) > 90
  AND (i.plogi_loc = i.logi_loc OR l.perm = 'Y');  -- Should find exclusions
```

**Expected Results**:
- Records returned here should NOT appear in the MN1RE report
- All MN1RE report records should have plogi_loc != logi_loc AND perm = 'N'

**Validation Points**:
- Verify home slot inventory (plogi_loc = logi_loc) is excluded
- Verify permanent locations (perm = 'Y') are excluded
- Cross-check with report to ensure proper filtering

---

### Step 4: Validate UOM and Quantity Calculations

**Purpose**: Verify the case/split quantity calculations respect UOM settings.

**SQL Query**:
```sql
-- Validate UOM-aware quantity calculations
SELECT buyer, prod_id, logi_loc,
       qoh, spc, inv_uom,
       -- Report calculation logic
       DECODE(NVL(inv_uom,0), 1, 0, NVL(TRUNC(qoh/NVL(spc,1)),0)) as calc_cases,
       DECODE(NVL(inv_uom,0), 1, qoh, 0, NVL(MOD(qoh, NVL(spc,1)),0), 2, 0) as calc_splits,
       -- UOM display logic  
       DECODE(NVL(inv_uom,0), 0, 'CS/SP', 1, 'SP', 2, 'CS') as uom_display
FROM v_mn1re
ORDER BY buyer, prod_id;
```

**Expected Results**:
- Cases = 0 when inv_uom = 1 (split-only items)
- Splits = 0 when inv_uom = 2 (case-only items) 
- Cases = qoh/spc, Splits = qoh%spc when inv_uom = 0 (both cases and splits)

**Validation Points**:
- Verify quantity calculations match report display
- Confirm UOM indicator matches quantity distribution
- Check for division by zero with null SPC values

---

### Step 5: Verify Zone and Location Filtering

**Purpose**: Ensure proper zone filtering excludes home slots and includes only valid reserve zones.

**SQL Query**:
```sql
-- Validate zone filtering logic
SELECT DISTINCT z.rule_id, z.zone_type, z.zone_id,
       COUNT(*) as location_count,
       COUNT(DISTINCT i.logi_loc) as pallet_count
FROM v_mn1re v, inv i, lzone lz, zone z, loc l
WHERE v.logi_loc = i.logi_loc
  AND v.plogi_loc = l.logi_loc
  AND l.logi_loc = lz.logi_loc  
  AND lz.zone_id = z.zone_id
GROUP BY z.rule_id, z.zone_type, z.zone_id
ORDER BY z.rule_id;
```

**Expected Results**:
- Should NOT include zones with rule_id = 1
- Should include various reserve zone types (rule_id != 1)

**Validation Points**:
- No home slot zones (rule_id = 1) should appear
- Zone filtering matches business requirements
- Location assignments are consistent with zone rules

---

### Step 6: Validate Customer Preferred Vendor (CPV) Logic

**Purpose**: Verify CPV indicators and product matching logic.

**SQL Query**:
```sql
-- Validate CPV logic and product relationships
SELECT buyer, prod_id, cust_pref_vendor,
       CASE 
         WHEN cust_pref_vendor = '-' THEN ' '
         WHEN cust_pref_vendor != '-' THEN '*'
         ELSE cust_pref_vendor
       END as cpv_display,
       COUNT(*) as pallet_count
FROM v_mn1re
GROUP BY buyer, prod_id, cust_pref_vendor
ORDER BY buyer, prod_id;
```

**Expected Results**:
- CPV should show '*' for customer preferred items
- CPV should show ' ' for non-preferred (standard) items
- Product/CPV combinations should be consistent

**Validation Points**:
- Verify CPV display logic matches report output
- Confirm product master relationships are correct
- Check for data consistency across pallets of same item

---

### Step 7: Cross-Validate with Source Tables

**Purpose**: Verify report data matches underlying table data directly.

**SQL Query**:
```sql
-- Direct table validation
SELECT i.prod_id, i.cust_pref_vendor, i.logi_loc, i.plogi_loc,
       i.qoh, i.inv_date, i.status, i.inv_uom,
       p.buyer, p.spc, p.descrip, p.mfg_sku, p.vendor_id,
       l.perm, l.logi_loc as loc_id,
       ROUND(sysdate - i.inv_date, 0) as days_old
FROM inv i, pm p, loc l
WHERE (sysdate - i.inv_date) > 90
  AND i.plogi_loc != i.logi_loc
  AND i.plogi_loc = l.logi_loc
  AND i.prod_id = p.prod_id
  AND i.cust_pref_vendor = p.cust_pref_vendor
  AND l.perm = 'N'
  AND EXISTS (SELECT 'x' FROM zone z, lzone lz
              WHERE z.rule_id != 1
                AND lz.zone_id = z.zone_id
                AND lz.logi_loc = l.logi_loc)
ORDER BY p.buyer, i.prod_id;
```

**Expected Results**:
- Results should exactly match v_mn1re view data
- All filtering criteria should be properly applied
- Record count and content should be identical

**Validation Points**:
- Compare record counts between direct query and view
- Verify all filter conditions are working correctly
- Confirm no data transformation issues

---

### Step 8: Validate Report Formatting and Totals

**Purpose**: Verify report formatting, column alignments, and any summary calculations.

**SQL Query**:
```sql
-- Summary validation for report totals
SELECT buyer,
       COUNT(*) as total_pallets,
       COUNT(DISTINCT prod_id) as unique_items,
       SUM(DECODE(NVL(inv_uom,0), 1, 0, NVL(TRUNC(qoh/NVL(spc,1)),0))) as total_cases,
       SUM(DECODE(NVL(inv_uom,0), 1, qoh, 0, NVL(MOD(qoh, NVL(spc,1)),0), 2, 0)) as total_splits,
       ROUND(AVG(sysdate - inv_date), 1) as avg_days_old,
       MAX(sysdate - inv_date) as oldest_days
FROM v_mn1re
GROUP BY buyer
ORDER BY buyer;
```

**Expected Results**:
- Summary statistics for each buyer group
- Totals should align with manual counts from printed report
- Averages provide insight into aging distribution

**Validation Points**:
- Verify buyer groupings match report sections
- Confirm quantity totals are accurate
- Check for reasonable aging distribution

---

### Step 9: Validate Globalization and Date Formatting

**Purpose**: Verify multi-language support and date formatting are working correctly.

**SQL Query**:
```sql
-- Validate globalization support
SELECT DISTINCT grd.lang_id, grd.report_name, grd.fld_lbl_name, grd.fld_lbl_desc
FROM global_report_dict grd
WHERE grd.report_name = 'mn1re'
ORDER BY grd.fld_lbl_name;

-- Validate date formatting
SELECT DISTINCT gdf.format_seq, gdf.format_mask, gdf.format_desc
FROM global_date_format gdf
WHERE gdf.format_seq IN (1, 10);
```

**Expected Results**:
- Should return field labels for the active language
- Date formats should be properly configured
- Language-specific labels should match report headers

**Validation Points**:
- Verify report headers match globalization settings
- Confirm date formats are applied consistently
- Check multi-language support if applicable

---

### Step 10: Exception and Edge Case Testing

**Purpose**: Test edge cases and potential data anomalies.

**SQL Query**:
```sql
-- Test for edge cases and potential issues
SELECT 'Null SPC Values' as test_case, COUNT(*) as count
FROM v_mn1re WHERE spc IS NULL OR spc = 0
UNION ALL
SELECT 'Null QOH Values', COUNT(*)
FROM v_mn1re WHERE qoh IS NULL
UNION ALL
SELECT 'Zero QOH Values', COUNT(*) 
FROM v_mn1re WHERE qoh = 0
UNION ALL
SELECT 'Future Inv Dates', COUNT(*)
FROM v_mn1re WHERE inv_date > sysdate
UNION ALL
SELECT 'Null Buyers', COUNT(*)
FROM v_mn1re WHERE buyer IS NULL
UNION ALL
SELECT 'Long Aging (>365 days)', COUNT(*)
FROM v_mn1re WHERE (sysdate - inv_date) > 365;
```

**Expected Results**:
- Identify any data quality issues
- Highlight extremely aged inventory (>365 days)
- Find any null or zero values that might cause calculation errors

**Validation Points**:
- Review any significant counts for data quality issues
- Investigate extremely aged inventory for business impact
- Confirm null value handling is appropriate

---

## Common Validation Issues and Troubleshooting

### Issue 1: Missing Expected Records
**Possible Causes**:
- Records may not meet 90-day threshold
- Inventory may be in permanent locations (home slots)
- Zone filtering may exclude certain areas

**Investigation Query**:
```sql
SELECT COUNT(*) as borderline_records
FROM inv i, pm p, loc l
WHERE (sysdate - i.inv_date) BETWEEN 85 AND 95
  AND i.plogi_loc = l.logi_loc
  AND i.prod_id = p.prod_id
  AND i.cust_pref_vendor = p.cust_pref_vendor;
```

### Issue 2: Incorrect Quantity Calculations
**Possible Causes**:
- UOM settings not properly handled
- Null or zero SPC values
- Rounding differences in calculations

**Investigation Query**:
```sql
SELECT prod_id, qoh, spc, inv_uom,
       TRUNC(qoh/spc) as manual_cases,
       MOD(qoh, spc) as manual_splits
FROM v_mn1re
WHERE spc IS NULL OR spc = 0;
```

### Issue 3: Zone Filtering Problems  
**Possible Causes**:
- Zone rule definitions changed
- Location zone assignments modified
- Zone hierarchy issues

**Investigation Query**:
```sql
SELECT z.rule_id, z.zone_type, COUNT(*) as affected_locations
FROM v_mn1re v, loc l, lzone lz, zone z
WHERE v.plogi_loc = l.logi_loc
  AND l.logi_loc = lz.logi_loc
  AND lz.zone_id = z.zone_id
GROUP BY z.rule_id, z.zone_type;
```

---

## Performance Considerations

### Query Optimization
- Ensure proper indexing on inv.inv_date for date range queries
- Index on inv.plogi_loc and inv.logi_loc for location filtering
- Consider indexing on pm.buyer for grouping operations

### Report Execution Time
- Typical execution time should be under 2 minutes for most warehouses
- Large datasets (>10,000 aged pallets) may require longer processing
- Consider running during off-peak hours for large warehouses

---

## Business Impact and Follow-up Actions

### Typical Report Uses
1. **Inventory Disposition**: Identify candidates for markdown, disposal, or vendor return
2. **Vendor Accountability**: Hold suppliers accountable for slow-moving inventory
3. **Space Management**: Free up reserve locations for active inventory
4. **Audit Compliance**: Document aging inventory for regulatory requirements

### Recommended Follow-up Procedures
1. **Review with Buyers**: Coordinate with purchasing teams for vendor discussions
2. **Physical Verification**: Confirm inventory condition and location accuracy
3. **Disposition Planning**: Develop action plans for aged inventory movement
4. **System Updates**: Update inventory status or create movement tasks as needed

---

## Conclusion

The MN1RE report provides essential visibility into aged reserve inventory that requires management attention. Proper validation ensures accurate identification of inventory exceeding aging thresholds and supports effective inventory management decisions. Regular execution and review of this report helps maintain optimal inventory turnover and space utilization in warehouse operations.

The comprehensive validation steps outlined above ensure data accuracy, business rule compliance, and proper report functionality across various warehouse configurations and inventory scenarios.
