# ME1RA Equipment Overview Report - Analysis and Validation Guide

## 1. Report Overview

### 1.1 Report Purpose
**ME1RA** is an Equipment Overview Report that provides a comprehensive listing of equipment and their associated zone assignments within the SWMS (Sysco Warehouse Management System). This report displays equipment IDs, descriptions, zone IDs, and zone descriptions in a formatted output.

### 1.2 Technical Architecture
- **Programming Language**: C with embedded SQL (Oracle Pro*C)
- **Source File**: `rpts/mnt/me1ra.pc` (218 lines)
- **Database**: Oracle with SWMS schema
- **Output Format**: Formatted text report
- **Globalization**: Supports internationalization via `GLOBAL_REPORT_DICT` table

### 1.3 Data Source Structure
The report queries the view `v_me1ra` with the following structure:
```sql
SELECT equip_id, e_descrip, zone_id, z_descrip FROM v_me1ra
```

**Note**: The actual view definition `v_me1ra` was not found in the codebase, but based on the query structure and database relationships, it likely joins the following core tables:

## 2. Database Schema Analysis

### 2.1 Core Tables and Relationships

#### Equipment Table (EQUIP)
- **Primary Key**: `equip_id`
- **Key Fields**: 
  - `equip_id` - Equipment identifier
  - `descrip` - Equipment description
  - `user_id` - User assigned to equipment

#### Zone Table (ZONE)
- **Primary Key**: `zone_id`
- **Key Fields**:
  - `zone_id` - Zone identifier
  - `zone_type` - Type (PUT, PIK, etc.)
  - `rule_id` - Putaway/pick rule identifier
  - `induction_loc` - Induction location for miniload zones

#### Equipment-Zone Relationship Table (ZEQUIP)
- **Composite Key**: `equip_id`, `zone_id`
- **Purpose**: Maps equipment to zones they can operate in
- **Key Fields**:
  - `equip_id` - References EQUIP.equip_id
  - `zone_id` - References ZONE.zone_id

### 2.2 Inferred View Structure
Based on the database relationships and report query, `v_me1ra` likely contains:
```sql
-- Inferred structure of v_me1ra
CREATE OR REPLACE VIEW v_me1ra AS
SELECT 
    e.equip_id,
    e.descrip AS e_descrip,
    z.zone_id,
    z.descrip AS z_descrip
FROM equip e
JOIN zequip ze ON e.equip_id = ze.equip_id
JOIN zone z ON ze.zone_id = z.zone_id
ORDER BY e.equip_id, z.zone_id;
```

## 3. Report Processing Flow

### 3.1 Initialization
1. **Globalization Setup**: Calls `init_globalisation()` to load field labels from `GLOBAL_REPORT_DICT`
2. **Parameter Processing**: Processes any runtime parameters
3. **Database Connection**: Establishes Oracle connection

### 3.2 Data Retrieval
1. **Main Query Execution**: 
   ```c
   EXEC SQL DECLARE C1 CURSOR FOR
   SELECT equip_id,e_descrip,zone_id,z_descrip FROM v_me1ra;
   ```
2. **Cursor Processing**: Iterates through results using `get_report()` function
3. **Field Formatting**: Applies report formatting using `report_util.c` library

### 3.3 Output Generation
1. **Header Generation**: Creates report headers with globalized labels
2. **Detail Lines**: Outputs equipment and zone information
3. **Report Completion**: Closes cursors and finalizes output

## 4. Validation Steps for QA Engineers

### 4.1 Pre-Execution Validation

#### Database Connectivity Test
```sql
-- Test 1: Verify database connection
SELECT 1 FROM dual;
```

#### View Existence Verification
```sql
-- Test 2: Check if v_me1ra view exists
SELECT COUNT(*) FROM user_views WHERE view_name = 'V_ME1RA';
-- Expected Result: 1 (if view exists)
```

#### Core Table Validation
```sql
-- Test 3: Verify core tables exist and have data
SELECT 'EQUIP' table_name, COUNT(*) record_count FROM equip
UNION ALL
SELECT 'ZONE', COUNT(*) FROM zone
UNION ALL  
SELECT 'ZEQUIP', COUNT(*) FROM zequip;
```

### 4.2 Data Integrity Validation

#### Equipment Data Validation
```sql
-- Test 4: Check for equipment without descriptions
SELECT equip_id, 'Missing description' AS issue
FROM equip 
WHERE descrip IS NULL OR TRIM(descrip) = '';

-- Test 5: Check for duplicate equipment IDs
SELECT equip_id, COUNT(*) 
FROM equip 
GROUP BY equip_id 
HAVING COUNT(*) > 1;
```

#### Zone Data Validation
```sql
-- Test 6: Check for zones without valid types
SELECT zone_id, zone_type, 'Invalid zone type' AS issue
FROM zone 
WHERE zone_type NOT IN ('PUT', 'PIK', 'INB', 'OUT');

-- Test 7: Check for zones without descriptions  
SELECT zone_id, 'Missing description' AS issue
FROM zone 
WHERE descrip IS NULL OR TRIM(descrip) = '';
```

#### Equipment-Zone Relationship Validation
```sql
-- Test 8: Check for orphaned equipment-zone relationships
SELECT ze.equip_id, ze.zone_id, 'Orphaned equipment reference' AS issue
FROM zequip ze
LEFT JOIN equip e ON ze.equip_id = e.equip_id
WHERE e.equip_id IS NULL

UNION ALL

SELECT ze.equip_id, ze.zone_id, 'Orphaned zone reference' AS issue  
FROM zequip ze
LEFT JOIN zone z ON ze.zone_id = z.zone_id
WHERE z.zone_id IS NULL;
```

### 4.3 Report Output Validation

#### Sample Data Verification
```sql
-- Test 9: Verify sample report data matches expected format
SELECT 
    equip_id,
    e_descrip,
    zone_id, 
    z_descrip
FROM v_me1ra
WHERE ROWNUM <= 10
ORDER BY equip_id, zone_id;
```

#### Globalization Validation
```sql
-- Test 10: Check globalized field labels exist
SELECT msg_id, v_msg_english 
FROM global_report_dict 
WHERE rpt_id = 'me1ra'
AND msg_id IN ('EQUIP_ID', 'DESCRIP', 'ZONE_ID', 'TITLE')
ORDER BY msg_id;
```

#### Cross-Reference Validation
```sql
-- Test 11: Validate equipment assignments across operational areas
SELECT 
    e.equip_id,
    e.descrip AS equipment_description,
    COUNT(DISTINCT z.zone_type) AS zone_types_assigned,
    COUNT(ze.zone_id) AS total_zones_assigned
FROM equip e
JOIN zequip ze ON e.equip_id = ze.equip_id  
JOIN zone z ON ze.zone_id = z.zone_id
GROUP BY e.equip_id, e.descrip
ORDER BY e.equip_id;
```

### 4.4 Performance Validation

#### Query Performance Test
```sql
-- Test 12: Check query execution time
SET TIMING ON
SELECT COUNT(*) FROM v_me1ra;
-- Expected: Should complete within 5 seconds for normal data volumes
```

#### Index Utilization Verification
```sql  
-- Test 13: Verify proper indexing exists
SELECT table_name, index_name, column_name
FROM user_ind_columns  
WHERE table_name IN ('EQUIP', 'ZONE', 'ZEQUIP')
AND column_name IN ('EQUIP_ID', 'ZONE_ID')
ORDER BY table_name, index_name, column_position;
```

## 5. Common Issues and Troubleshooting

### 5.1 Data Issues

**Issue**: Report shows no data
- **Cause**: View `v_me1ra` doesn't exist or returns no rows
- **Solution**: Verify view existence and data in base tables
- **Validation Query**: `SELECT COUNT(*) FROM v_me1ra;`

**Issue**: Equipment appears without zones
- **Cause**: Missing entries in ZEQUIP table
- **Solution**: Run zone assignment scripts
- **Related Scripts**: `add_all_zones_to_equip.sh`, `add_zone_to_equip.sh`

**Issue**: Incomplete descriptions
- **Cause**: NULL or empty description fields
- **Solution**: Update equipment/zone descriptions in maintenance screens

### 5.2 Performance Issues

**Issue**: Slow report execution
- **Cause**: Missing indexes or large data volume
- **Solution**: Analyze execution plan and add appropriate indexes
- **Monitoring**: Use `EXPLAIN PLAN` on the main query

### 5.3 Globalization Issues

**Issue**: Field labels not displaying in correct language
- **Cause**: Missing entries in GLOBAL_REPORT_DICT
- **Solution**: Insert required language-specific labels
- **Validation**: Check `GLOBAL_REPORT_DICT` for report ID 'me1ra'

## 6. Report Dependencies

### 6.1 Required Database Objects
- **View**: `v_me1ra` (primary data source)
- **Tables**: `equip`, `zone`, `zequip`, `global_report_dict`
- **Indexes**: Primary keys and foreign key indexes on relationship tables

### 6.2 System Dependencies  
- **Oracle Database**: Version compatibility with Pro*C
- **Report Utilities**: `report_util.c` library functions
- **Globalization**: Language-specific label support

### 6.3 Operational Dependencies
- **Equipment Setup**: Equipment must be properly configured in SWMS
- **Zone Assignment**: Equipment-zone relationships maintained via ZEQUIP
- **User Access**: Appropriate permissions to execute report

## 7. Maintenance and Updates

### 7.1 Regular Maintenance Tasks
1. **Monthly**: Validate equipment-zone assignments
2. **Quarterly**: Review performance and optimize if needed  
3. **Semi-annually**: Update globalization labels as needed

### 7.2 Data Refresh Procedures
- Equipment changes: Automatic via SWMS maintenance screens
- Zone assignments: Manual via zone assignment scripts
- Description updates: Through standard SWMS maintenance

### 7.3 Performance Monitoring
- Monitor report execution times
- Track data volume growth
- Review index effectiveness quarterly

---

**Document Version**: 1.0  
**Last Updated**: August 1, 2025  
**Author**: QA Validation Team  
**Review Cycle**: Quarterly or when system changes occur

## 8. Appendix

### 8.1 Related Files and Scripts
- **Main Source**: `rpts/mnt/me1ra.pc`
- **Build File**: `rpts/makefile` (contains ME1RA build targets)
- **Zone Assignment Scripts**: 
  - `pgms/runsql/add_all_zones_to_equip.sh`
  - `pgms/runsql/add_zone_to_equip.sh`
  - `pgms/runsql/delete_equipment.sh`
- **Validation Scripts**: `pgms/runsql/forklift_setup_check`

### 8.2 Database Schema References
The following tables are referenced throughout the SWMS system for equipment and zone management:

#### Core Tables
- `EQUIP` - Equipment master table
- `ZONE` - Zone definition table  
- `ZEQUIP` - Equipment-zone assignment table
- `GLOBAL_REPORT_DICT` - Internationalization labels

#### Supporting Tables
- `LOC` - Location master
- `LZONE` - Location-zone relationships
- `SEL_EQUIP` - Selection equipment configuration
- `PM` - Product master (includes zone assignments)

### 8.3 SQL Templates for Validation

#### Complete Equipment Audit
```sql
-- Complete equipment and zone assignment audit
WITH equipment_summary AS (
    SELECT 
        e.equip_id,
        e.descrip,
        e.user_id,
        COUNT(ze.zone_id) AS zones_assigned
    FROM equip e
    LEFT JOIN zequip ze ON e.equip_id = ze.equip_id
    GROUP BY e.equip_id, e.descrip, e.user_id
),
zone_summary AS (
    SELECT 
        z.zone_id,
        z.zone_type,
        z.rule_id,
        COUNT(ze.equip_id) AS equipment_assigned
    FROM zone z
    LEFT JOIN zequip ze ON z.zone_id = ze.zone_id
    GROUP BY z.zone_id, z.zone_type, z.rule_id
)
SELECT 
    'Equipment without zones' AS audit_type,
    COUNT(*) AS count
FROM equipment_summary 
WHERE zones_assigned = 0
UNION ALL
SELECT 
    'Zones without equipment',
    COUNT(*)
FROM zone_summary 
WHERE equipment_assigned = 0
UNION ALL
SELECT 
    'Total equipment',
    COUNT(*)
FROM equipment_summary
UNION ALL
SELECT 
    'Total zones',
    COUNT(*)
FROM zone_summary;
```

#### Performance Baseline Query
```sql
-- Baseline performance measurement for report data
SELECT 
    COUNT(*) AS total_rows,
    COUNT(DISTINCT equip_id) AS unique_equipment,
    COUNT(DISTINCT zone_id) AS unique_zones,
    SYSDATE AS measurement_timestamp
FROM v_me1ra;
```
