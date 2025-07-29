# COOL Item Cross Reference Report Documentation

## 📝 Report Overview

### What does this report present?
The COOL (Country of Origin Labeling) Item Cross Reference Report is a warehouse management system report that displays product information related to FDA Country of Origin Labeling requirements. The report provides detailed information about products that require COOL tracking, including their origin countries and whether they are wild-caught or farm-raised.

### Purpose and Intended Audience
- **Primary Purpose**: Track and report on products subject to COOL regulations for compliance with FDA requirements
- **Intended Audience**: 
  - Warehouse managers and supervisors
  - Compliance officers
  - Quality assurance teams
  - Operations staff responsible for product labeling and tracking

### Report Types
The report supports three distinct output formats based on conditional parameters:
1. **Items Set Up** (`2=2`): Shows products that have COOL data properly configured
2. **All Items** (`3=3`): Displays all COOL-required items, marking those with setup data
3. **Items Not Set Up** (`4=4`): Lists COOL-required items missing configuration data

## 🔍 Core Logic

### Primary Business Rules

#### Product Selection Criteria
The report identifies COOL-trackable products using these filters:
```sql
-- Core selection logic
p.category = c.haccp_code 
AND c.cool_trk = 'Y' 
AND substr(p.category,1,2) = o.category
AND p.prod_id NOT LIKE 'T%'  -- Excludes temporary items
```

#### Category-Level Filtering
Products must belong to categories configured for COOL tracking:
- Links product categories to HACCP codes
- Validates category is marked for COOL tracking (`cool_trk = 'Y'`)
- Applies item-level tracking rules if configured

#### COOL Data Validation
For setup validation, the system checks:
```sql
EXISTS (SELECT 1 FROM cool_item i 
        WHERE p.prod_id = i.prod_id  
        AND p.cust_pref_vendor = i.cust_pref_vendor)
```

### Processing Steps

1. **Master Query Execution**: Retrieves categories and item counts
2. **Detail Processing**: For each category, fetches individual product details
3. **COOL Data Enhancement**: Adds country of origin and wild/farm designation
4. **Inventory Integration**: Includes quantity on hand and location data
5. **Formatting and Output**: Applies proper spacing and pagination

### Key Calculations

#### Quantity Display Logic
- **Case Quantity**: `QOH / SPC` (Quantity on Hand divided by Splits per Case)
- **Split Quantity**: `QOH % SPC` (Remainder after case calculation)
- **Location Formatting**: Converts `AABBCC` format to `AA-BB-CC`

#### Page Layout Management
- **Lines per Page**: 59-60 lines (adjustable for different report widths)
- **Form Feed Control**: Automatic page breaks when space insufficient
- **Title Repetition**: Headers repeat on each new page

## 💼 Business Value

### Regulatory Compliance
- **FDA Compliance**: Ensures proper Country of Origin Labeling per federal requirements
- **Audit Trail**: Provides documentation for regulatory inspections
- **Gap Analysis**: Identifies products missing required COOL setup

### Operational Efficiency
- **Setup Validation**: Quickly identifies products needing COOL configuration
- **Inventory Integration**: Combines compliance data with current stock levels
- **Exception Reporting**: Highlights items requiring attention

### Use Cases

#### Daily Operations
- **Receiving Verification**: Validate incoming products have proper COOL setup
- **Picking Guidance**: Ensure picked items meet labeling requirements
- **Inventory Management**: Track COOL items alongside standard inventory

#### Compliance Management
- **Audit Preparation**: Generate comprehensive COOL item listings
- **Setup Monitoring**: Regular reports to ensure complete COOL coverage
- **Exception Handling**: Identify and resolve missing COOL data

#### Quality Assurance
- **Data Validation**: Verify COOL information accuracy
- **Process Improvement**: Monitor COOL setup completion rates
- **Training Support**: Educate staff on COOL requirements

## ✅ Validation & Accuracy Checks

### Data Integrity Verification

#### Category Validation
1. **Expected Categories**: All categories with `cool_trk = 'Y'` should appear
2. **Item Counts**: Category totals should match individual item listings
3. **Exclusions**: Temporary items (starting with 'T') should not appear

#### COOL Data Verification
1. **Setup Items Report (`2=2`)**:
   - All listed items should have entries in `cool_item` table
   - Each item should display country of origin and wild/farm status
   - Asterisk (*) should appear next to items with complete setup

2. **All Items Report (`3=3`)**:
   - Should include both setup and non-setup items
   - Items with COOL data marked with asterisk (*)
   - Total count should match category summary

3. **Not Set Up Report (`4=4`)**:
   - Should only show items lacking COOL setup
   - No asterisks should appear
   - Count should equal (All Items - Setup Items)

### Quality Assurance Checks

#### Database Consistency
```sql
-- Verify category setup
SELECT category, cool_trk 
FROM haccp_codes 
WHERE cool_trk = 'Y'

-- Check item coverage
SELECT COUNT(*) 
FROM pm p, haccp_codes c 
WHERE p.category = c.haccp_code 
AND c.cool_trk = 'Y'
```

#### Report Output Validation
1. **Header Information**: Verify date/time, user ID, and company name
2. **Page Numbering**: Confirm sequential page numbers
3. **Line Formatting**: Check column alignment and data truncation
4. **Totals Reconciliation**: Ensure category counts match detail listings

### Expected Output Patterns

#### Setup Items Report
```
CATEG: XX Description
PROD_ID  CPV    R DESCRIP           PACK/SIZE    BRAND  MFG_SKU   HOME_SLOT  CASE  SPLIT
1234567  001    Y Product Name      12/16OZ      BRAND  SKU123    01-02-03   10    5
  W/F Country
  F   United States    W   Mexico
```

#### All Items Report
```
CATEG: XX Description
1234567 * Product Name    2345678   Product Name 2    3456789   Product Name 3
```

## 🧩 Related Code Context

### Database Schema Dependencies

#### Core Tables
- **`pm`** (Product Master): Primary product information
- **`haccp_codes`**: Category-level COOL tracking configuration
- **`cool_category`**: Category mapping and item tracking rules
- **`cool_item`**: Individual product COOL setup data
- **`cool_item_master`**: Master COOL item configuration

#### Supporting Tables
- **`coo_codes`**: Country of origin code translations
- **`wf_codes`**: Wild/farm designation codes and descriptions
- **`loc`**: Product location information
- **`inv`**: Current inventory quantities
- **`sys_config`**: System configuration (company name)

### Integration Points

#### Inventory Management System
- **Location Integration**: Links COOL items to physical warehouse locations
- **Quantity Tracking**: Includes current stock levels in compliance reporting
- **UOM Handling**: Supports both case and split-level reporting

#### Configuration Management
- **Global Labels**: Supports internationalization through `global_report_dict`
- **Dynamic Conditions**: Allows flexible report filtering via condition files
- **User Customization**: Supports custom titles and output destinations

### Code Architecture

#### Query Construction
The report uses dynamic SQL construction to handle various filtering conditions:
```c
// Master query building
snprintf(hszSqlStmt.arr, sizeof hszSqlStmt.arr, 
         "%s %s %s AND %s AND %s", 
         MASTER_STMT, FROM_STMT, COND_STMT, COND_STMT2, COND_STMT4);
```

#### Cursor Management
Multiple cursor patterns handle different data retrieval needs:
- **Master Cursor**: Category-level data
- **Detail Cursors**: Item-specific information
- **COOL Cursors**: Country and wild/farm data

#### Memory Management
- **String Handling**: Extensive use of VARCHAR arrays for Oracle integration
- **Buffer Management**: Careful attention to string length limits and null termination
- **Error Handling**: Comprehensive SQLCODE checking and logging

### External Dependencies

#### Oracle Database
- **Embedded SQL**: Uses Oracle Pro*C precompiler directives
- **SQLCA Integration**: Standard Oracle error handling
- **Dynamic SQL**: PREPARE/EXECUTE pattern for flexible queries

#### SWMS Libraries
- **`libswmsora.pc`**: Oracle connection management
- **`ora_retrv_cond.pc`**: Condition retrieval utilities
- **Globalization Functions**: Multi-language support utilities

#### System Integration
- **APLOG Facility**: Comprehensive logging and error reporting
- **File I/O**: Support for custom output and error file destinations
- **Command Line**: Standard Unix-style argument processing

### Performance Considerations

#### Query Optimization
- **Index Usage**: Relies on proper indexing of category, prod_id, and cust_pref_vendor
- **Join Efficiency**: Uses EXISTS clauses for better performance than traditional joins
- **Rownum Limiting**: Uses ROWNUM = 1 for single-record lookups

#### Memory Efficiency
- **Cursor Processing**: Processes records individually rather than loading entire result sets
- **String Management**: Uses fixed-length arrays to prevent memory fragmentation
- **Resource Cleanup**: Explicit cursor closing and file handle management

---

*This documentation covers the COOL Item Cross Reference Report (Program Code: MCC1) as implemented in the SWMS warehouse management system. For technical support or questions about implementation details, consult the system administrator or development team.*