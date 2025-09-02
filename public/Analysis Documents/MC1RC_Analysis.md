# MC1RC - COOL Item Cross Reference Report Analysis

## Executive Summary

The **MC1RC** (COOL Item Cross Reference Report) is a comprehensive maintenance report that provides visibility into Country of Origin Labeling (COOL) compliance for food products in the SWMS system. This report generates cross-reference data for COOL-tracked items, displaying their setup status, country of origin information, and wild/farm indicators to ensure regulatory compliance.

### Key Functions
- **COOL Compliance Tracking**: Monitors items requiring country of origin labeling
- **Setup Status Verification**: Identifies items with missing COOL configuration
- **Cross-Reference Reporting**: Displays relationships between products and COOL data
- **Regulatory Compliance**: Supports food safety and labeling requirements

---

## Technical Architecture

### Programming Framework
- **Language**: C with embedded SQL (Oracle Pro*C)
- **Source File**: `rpts/mnt/mc1rc.pc` (2,857 lines)
- **Report Type**: Maintenance/compliance report
- **Database**: Oracle with COOL-specific tables

### Core Dependencies
```
PM               # Product Master - base item information
HACCP_CODES      # HACCP compliance codes with COOL tracking flags
COOL_ITEM        # Country of origin and wild/farm data per item
COOL_CATEGORY    # COOL tracking requirements by category
COOL_ITEM_MASTER # Master COOL item configuration
COO_CODES        # Country of origin code descriptions
LOC/INV          # Location and inventory data
```

### Report Output Modes
The report supports three distinct operational modes:

1. **E_SETUP_COOL** - Items with COOL data configured
2. **E_ALL_COOL** - All COOL-required items with setup indicators  
3. **E_ALL_COOL_WO_SETUP** - Items requiring COOL setup (missing configuration)

---

## Database Schema Analysis

### Primary Tables

#### COOL_ITEM Table
Stores country of origin and wild/farm data for individual items:
```sql
-- Key fields based on source analysis:
prod_id              VARCHAR2(7)    -- Product identifier
cust_pref_vendor     VARCHAR2(10)   -- Customer preferred vendor
country_of_origin    VARCHAR2(2)    -- Country code (e.g., 'US', 'CA')
wild_farm           VARCHAR2(1)    -- 'W' for wild, 'F' for farm-raised
```

#### COOL_CATEGORY Table
Defines COOL tracking requirements by product category:
```sql
-- Key fields based on source analysis:
category            VARCHAR2(2)    -- Product category prefix
item_trk           VARCHAR2(1)    -- 'Y' if item-level tracking required
```

#### COOL_ITEM_MASTER Table
Master configuration for COOL item tracking:
```sql
-- Used to determine if item-level tracking is properly configured
prod_id              VARCHAR2(7)
cust_pref_vendor     VARCHAR2(10)
-- Additional master configuration fields
```

### Key SQL Patterns

#### COOL Item Count Query
```sql
SELECT COUNT(1) 
FROM cool_item i
WHERE i.prod_id = :prod_id
AND   i.cust_pref_vendor = :cpv
```

#### Country of Origin Lookup
```sql
SELECT i.country_of_origin, c.country_name, COUNT(1)
FROM cool_item i, coo_codes c
WHERE i.prod_id = :prod_id
AND   i.cust_pref_vendor = :cpv
AND   i.country_of_origin = c.country_of_origin
GROUP BY i.country_of_origin, c.country_name
```

#### Wild/Farm Status Query
```sql
SELECT DISTINCT i.wild_farm
FROM cool_item i
WHERE prod_id = :prod_id
AND   cust_pref_vendor = :cpv
AND   country_of_origin = :country_code
```

---

## Core Functionality Analysis

### Report Generation Process

#### 1. Category Processing
- Retrieves all COOL-tracked categories from HACCP_CODES where `cool_trk = 'Y'`
- Groups items by category for organized reporting
- Calculates item counts per category for layout planning

#### 2. Item Data Retrieval
**Base Item Query**:
```sql
SELECT p.prod_id, p.cust_pref_vendor, p.descrip, p.pack, 
       trim(p.prod_size)||trim(prod_size_unit), p.brand, 
       p.mfg_sku, p.spc, DECODE(p.rdc_vendor_id, NULL, 'N', 'Y') rdc_item
FROM pm p, haccp_codes c, cool_category o
WHERE p.category = c.haccp_code 
AND c.cool_trk = 'Y' 
AND substr(p.category,1,2) = o.category
```

#### 3. COOL Status Determination
The report uses complex logic to determine COOL setup status:

**Setup Items Filter**:
```sql
EXISTS (SELECT 1 FROM cool_item i 
        WHERE p.prod_id = i.prod_id 
        AND p.cust_pref_vendor = i.cust_pref_vendor)
```

**Item-Level Tracking Check**:
```sql
((o.item_trk ='N') or 
 (o.item_trk ='Y' and EXISTS (SELECT 1 FROM cool_item_master cm
                             WHERE p.prod_id = cm.prod_id 
                             AND p.cust_pref_vendor = cm.cust_pref_vendor)))
```

#### 4. Location and Inventory Integration
```sql
SELECT DECODE(l.logi_loc, NULL, NULL,
              SUBSTR(l.logi_loc, 1, 2) || '-' ||
              SUBSTR(l.logi_loc, 3, 2) || '-' ||
              SUBSTR(l.logi_loc, 5, 2)),
       i.qoh
FROM loc l, inv i
WHERE l.logi_loc = i.plogi_loc (+)
AND   l.prod_id = i.prod_id (+)
AND   l.perm = 'Y' AND l.rank = 1
```

### Report Layout and Formatting

#### Page Structure
- **Header**: Title, date/time, page numbers, user information
- **Category Sections**: Grouped by product category
- **Item Details**: Product information with COOL status indicators
- **Pagination**: Automatic page breaks at 128 lines

#### Data Display Format
```
Item#     Description                 Brand    Pack/Size    Location    QOH
1234567   SALMON FILLET FRESH        SYSCO    12/8 OZ      DA-01-A1    150
          Country: US (UNITED STATES)
          Wild/Farm: W (WILD CAUGHT), F (FARM RAISED)
```

#### Status Indicators
- **"*"** prefix indicates items with COOL data configured
- **Blank** indicates items requiring COOL setup
- **Country codes** display with full country names
- **W/F codes** show wild-caught or farm-raised status

---

## Integration Points

### SWMS Core Systems
1. **Product Master (PM)**: Base item information and categorization
2. **HACCP Management**: Links COOL tracking to food safety compliance
3. **Inventory System**: Location and quantity information
4. **Globalization**: Multi-language support via `init_globalisation()`

### Regulatory Compliance
1. **COOL Regulations**: US Country of Origin Labeling requirements
2. **Food Safety**: Integration with HACCP compliance tracking
3. **Audit Trail**: Tracks which items have/lack proper COOL setup

### Reporting Framework
1. **APLOG Integration**: Comprehensive logging and error tracking
2. **Report Utilities**: Standard SWMS report formatting and pagination
3. **Output Management**: File and printer output capabilities

---

## Validation and Quality Assurance

### Data Validation Rules

#### 1. COOL Item Completeness
```c
// Validates that COOL-required items have setup
hiCoolCnt = 0;
EXEC SQL
    SELECT COUNT(1) INTO :hiCoolCnt
    FROM cool_item i
    WHERE i.prod_id = :hszProd
    AND   i.cust_pref_vendor = :hszCpv;

if (hiCoolCnt == 0) {
    // Log warning for missing COOL data
    snprintf(szMessage, sizeof szMessage,
        "%s TABLE=%s KEY=prod[%s/%s] MESSAGE=\"%s\"",
        PROGRAM_CODE, "COOL_ITEM", hszProd.arr, hszCpv.arr,
        "ORACLE selection of # of setup cool items failed");
    aplog_log(APLOG_SWMS, APLOG_WARNING, szMessage);
}
```

#### 2. Category Compliance Verification
```c
// Ensures all items in COOL categories are properly tracked
if (iNumNotSetItems <= 0) {
    // All items in category have COOL setup
    return (0);
}
```

#### 3. Data Integrity Checks
- **NULL handling**: Comprehensive indicator variable usage
- **String termination**: Proper NULL termination for all VARCHAR fields
- **Count validation**: Verification of item counts before processing

### Error Handling Strategy

#### Database Error Management
```c
if (sqlca.sqlcode) {
    snprintf(szMessage, sizeof szMessage,
        "%s TABLE=%s KEY=%s ACTION=%s MESSAGE=\"%s\" REASON=\"%.70s\"",
        PROGRAM_CODE, "PM, HACCP_CODES", "master5", "FETCH",
        "Fetching master5 cursor failed", sqlca.sqlerrm.sqlerrmc);
    aplog_log(APLOG_SWMS, APLOG_ERROR, szMessage);
    return (-1);
}
```

#### Resource Cleanup
```c
EXEC SQL close master5;
if (sqlca.sqlcode) {
    snprintf(szMessage, sizeof szMessage,
        "%s TABLE=%s KEY=%s ACTION=%s MESSAGE=\"%s\"",
        PROGRAM_CODE, "PM, HACCP_CODES", "master5", "CLOSE",
        "Oracle close of cursor failed");
    aplog_log(APLOG_SWMS, APLOG_WARNING, szMessage);
}
```

---

## Performance Considerations

### Query Optimization
1. **Indexed Access**: Uses primary keys (prod_id, cust_pref_vendor)
2. **Category Filtering**: Efficient category-based data retrieval
3. **EXISTS Clauses**: Optimized subquery patterns for setup status
4. **ROWNUM Limiting**: Limits location queries to single result

### Memory Management
1. **Cursor Management**: Proper cursor lifecycle management
2. **String Handling**: Fixed-length VARCHAR arrays for predictable memory usage
3. **Pagination**: Controlled line counting prevents memory overflow

### Scalability Factors
1. **Category Segmentation**: Processes data in category chunks
2. **Conditional Processing**: Skips categories with no setup requirements
3. **Efficient Counting**: Pre-counts items before detailed processing

---

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Missing COOL Data
**Symptom**: Items appear in "WO_SETUP" mode but should have COOL data
**Diagnosis**:
```sql
-- Check if item requires COOL tracking
SELECT c.cool_trk 
FROM pm p, haccp_codes c 
WHERE p.category = c.haccp_code 
AND p.prod_id = 'ITEM_ID';

-- Check current COOL setup
SELECT COUNT(*) 
FROM cool_item 
WHERE prod_id = 'ITEM_ID' 
AND cust_pref_vendor = 'CPV';
```
**Solution**: Add entries to COOL_ITEM table with appropriate country_of_origin and wild_farm values

#### 2. Category Not Appearing
**Symptom**: Expected category missing from report
**Diagnosis**:
```sql
-- Verify category COOL tracking
SELECT hc.haccp_code, hc.cool_trk 
FROM haccp_codes hc 
WHERE hc.haccp_code = 'CATEGORY';

-- Check if items exist in category
SELECT COUNT(*) 
FROM pm 
WHERE category = 'CATEGORY';
```
**Solution**: Ensure `cool_trk = 'Y'` in HACCP_CODES for the category

#### 3. Report Performance Issues
**Symptom**: Report takes excessive time to generate
**Diagnosis**:
- Check database statistics currency
- Verify index usage on PM, COOL_ITEM tables
- Monitor cursor fetch counts in debug logs
**Solution**: 
- Update table statistics
- Add conditional filters to reduce data scope
- Ensure proper indexing on join columns

#### 4. Globalization Issues
**Symptom**: Report labels not displaying correctly
**Diagnosis**: Check `init_globalisation()` function execution
**Solution**: Verify language configuration and label file availability

### Debug Information
Enable debug mode by setting DEBUG flag:
```c
#ifdef DEBUG
    if (gDebugFp)
        fprintf(gDebugFp, "mstrS3[%s]\n", hszSqlStmt.arr);
    snprintf(szMessage, sizeof szMessage, "%s mstrS3[%s]", 
             PROGRAM_CODE, hszSqlStmt.arr);
    aplog_log(APLOG_SWMS, APLOG_DEBUG, szMessage);
#endif
```

---

## Business Impact Analysis

### Regulatory Compliance Value
1. **COOL Compliance**: Ensures adherence to US labeling requirements
2. **Audit Readiness**: Provides comprehensive tracking for regulatory inspections
3. **Food Safety Integration**: Links origin tracking with HACCP compliance

### Operational Benefits
1. **Setup Monitoring**: Identifies items requiring COOL configuration
2. **Data Completeness**: Tracks country of origin and wild/farm status
3. **Cross-Reference Capability**: Provides relationships between products and compliance data

### Risk Mitigation
1. **Compliance Gaps**: Identifies items lacking required COOL setup
2. **Data Quality**: Ensures completeness of origin and production method data
3. **Regulatory Exposure**: Reduces risk of non-compliance penalties

---

## Future Enhancement Opportunities

### Functional Enhancements
1. **Real-time Validation**: Add online COOL data validation during item setup
2. **Automated Alerts**: Generate notifications for missing COOL configurations
3. **Batch Processing**: Add bulk COOL data import/update capabilities

### Technical Improvements
1. **Web Interface**: Develop browser-based report generation
2. **API Integration**: Create web services for COOL data access
3. **Mobile Support**: Enable mobile device access to COOL information

### Integration Opportunities
1. **STS Integration**: Link with supply chain tracking systems
2. **EDI Enhancement**: Include COOL data in electronic data interchange
3. **Label Generation**: Automatic COOL label creation from report data

---

## Conclusion

The MC1RC COOL Item Cross Reference Report serves as a critical compliance tool for managing Country of Origin Labeling requirements within the SWMS environment. Its comprehensive approach to tracking setup status, country of origin data, and wild/farm indicators ensures regulatory compliance while providing operational visibility into COOL configuration completeness.

The report's three-mode operation (setup items, all items, missing setup) provides flexibility for different compliance and maintenance scenarios, making it an essential tool for food safety managers, compliance officers, and warehouse operations staff.

Regular execution of this report helps maintain COOL compliance, supports audit readiness, and ensures that all required food products have proper country of origin labeling data configured in the system.

---

*Generated: $(Get-Date)*  
*Source: MC1RC COOL Item Cross Reference Report (mc1rc.pc)*  
*SWMS Version: Current*
