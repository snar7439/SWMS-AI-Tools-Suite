# OB1RC Report Analysis - Catch Weight Recording Worksheet

## 📝 Report Overview

**Report Name:** OB1RC - Catch Weight Recording Worksheet

**Purpose:** This report generates worksheets for recording actual catch weights of products during the loading/shipping process. It provides handwritten spaces for warehouse personnel to record the actual weights of variable-weight items (like meat, produce, deli items) that differ from standard case weights.

**Intended Audience:**
- Loading dock personnel
- Quality assurance staff
- Shipping supervisors
- Catch weight verification teams
- Inventory control specialists

**Output Format:** Formatted text report with handwritten recording spaces and a summary recap section

## 🔍 Core Logic

### Primary Business Rules

1. **Data Grouping Hierarchy:**
   - Primary: Truck Number and Company Code (Temperature zone)
   - Secondary: Batch Number
   - Tertiary: Source Location, Zone, Float Sequence, Stop Number

2. **Sorting Logic:**
   ```sql
   order by lpad(ltrim(rtrim(truck_no)),3,'0'),
            decode(comp_code,'F',1,'C',2,3), batch_no,
            src_loc, zone, to_number(substr(float_seq,2)), 
            stop_no desc, fd_seq_no
   ```

3. **Temperature Zone Processing:**
   - **'F' = Freezer** (Priority 1)
   - **'C' = Cooler** (Priority 2) 
   - **'D' = Dry** (Priority 3)

4. **Zone Calculations for Multi-Batch Floats:**
   ```c
   if (batch_seq > 1) {
       tmp_zone_no = zone + (numofzones) * (batch_seq - 1);
       zone = tmp_zone_no;
   }
   ```

5. **Handwritten Recording Spaces:**
   - Creates dashed lines (12 dashes per item) for manual weight entry
   - Generates spaces based on `cs_sp_qty` (case/split quantity)
   - Maximum 8 recording spaces per line

### Processing Steps

1. **Initialization:** Database connection and parameter processing
2. **Data Retrieval:** Fetch catch weight items using view `v_ob1rc`
3. **Report Generation:**
   - Page headers with truck/batch information
   - Detail rows for each catch weight item
   - Handwritten recording spaces (dashed lines)
   - Page recap summary
   - Final report summary with totals

4. **Control Break Logic:**
   - New page/batch when truck, company code, or batch number changes
   - Continued headers for multi-page batches

## 💼 Business Value

### Primary Use Cases

1. **Catch Weight Recording:**
   - Provides structured format for recording actual weights
   - Ensures all variable-weight items are captured
   - Supports regulatory compliance for weight verification

2. **Inventory Accuracy:**
   - Enables comparison between estimated and actual weights
   - Supports inventory adjustment processes
   - Provides audit trail for weight discrepancies

3. **Quality Control:**
   - Facilitates systematic weight verification
   - Helps identify products requiring catch weight recording
   - Supports customer satisfaction through accurate weights

4. **Operational Efficiency:**
   - Organizes catch weight items by logical loading sequence
   - Groups items by temperature zone for efficient processing
   - Provides clear identification of items requiring attention

### Decision Support

- **Load Planning:** Helps estimate actual truck weights vs. planned weights
- **Process Improvement:** Identifies patterns in catch weight variances
- **Compliance Management:** Supports regulatory weight verification requirements
- **Customer Service:** Ensures accurate billing for variable-weight items

## ✅ Validation & Accuracy Checks

### Data Verification Methods

1. **Cross-Reference Checks:**
   ```sql
   -- Verify against source tables:
   -- - floats table for float information
   -- - float_detail for detailed item data
   -- - pm table for product master data
   -- - ordm for order information
   ```

2. **Business Rule Validations:**
   - **Temperature Zone Consistency:** All items in batch should have same comp_code
   - **Sequence Validation:** Float sequences should follow logical order
   - **Quantity Verification:** cs_sp_qty should match expected values

3. **Format Validations:**
   - **Customer ID Format:** Must be valid 10-character customer identifier
   - **Product ID Format:** Must be valid 7-character product code
   - **Float Sequence:** Should follow pattern (e.g., F001, C002, D003)

### Expected Output Patterns

1. **Header Information:**
   ```
   OB1RC    ob1rc          Catch Weight Recording - FREEZER TRUCK 123 BATCH 456 ROUTE R789        PAGE   1
   MM/DD/YY HH:MM:SS                     SYSCO CORPORATION                                      USERNAME
   ```

2. **Detail Lines Format:**
   ```
   Location Stop # Customer   FLT-ZN Pack/Size      Brand   Item Description               Mfg ID   Item #  CPV  Qty  CT Seq
   -------- ------ ---------- ------ -------------- ------- ------------------------------ -------- ------- --- ----- -- --------
   A01B02   10.0   1234567890 F001-A1 12/16 OZ      SYSCO   BEEF TENDERLOIN CHOICE         87654321 1234567 ABC    25  CS 12345678
                    ------------ ------------ ------------ ------------ ------------ ------------ ------------ ------------
   ```

3. **Summary Sections:**
   - Page recap showing truck, batch, pages, and pieces
   - Final report totals
   - "END OF REPORT" footer

### Quality Assurance Checkpoints

1. **Data Completeness:**
   - All catch weight items appear for selected trucks/routes
   - No missing product information (description, pack size, etc.)
   - All handwritten spaces generated correctly

2. **Calculation Accuracy:**
   - Verify piece counts match cs_sp_qty values
   - Confirm zone calculations for multi-batch floats
   - Check page numbering and recap totals

3. **Format Consistency:**
   - Headers appear on all pages
   - Handwritten spaces align properly
   - Temperature zones display correctly (FREEZER/COOL/DRY)

4. **Usability Verification:**
   - Adequate space for handwritten entries
   - Clear item identification information
   - Logical grouping and sequencing

## 🧩 Related Code Context

### Database Dependencies

1. **Primary View:** `v_ob1rc`
   - Central view for catch weight items
   - Combines float, product, and order data
   - Filters for items requiring catch weight recording

2. **System Configuration:**
   - `sys_config.START_FLOAT_CH`: Defines starting character for float sequences
   - Temperature zone configuration
   - Company name and formatting preferences

3. **Supporting Tables:**
   - `floats`: Float master information
   - `sel_equip`: Selection equipment for zone calculations
   - `pm`: Product master for item details
   - `float_detail`: Detailed float item information

### Key Data Elements

1. **Product Information:**
   ```c
   // Enhanced for 212 project (SCE042/SCE057)
   varchar cust_id[10];        // Expanded from 7 to 10 characters
   varchar pack_size[15];      // Expanded from 12 to 15 characters
   varchar prod_id[8];         // Product identifier
   varchar mfg_sku[15];        // Manufacturer SKU
   varchar cust_pref_vendor[7]; // Customer preferred vendor
   ```

2. **Float/Location Data:**
   ```c
   varchar float_seq[5];       // Float sequence (e.g., F001, C002)
   varchar src_loc[11];        // Source location in warehouse
   int zone;                   // Warehouse zone (adjusted for multi-batch)
   float stop_no;              // Customer stop number
   ```

3. **Quantity Information:**
   ```c
   float cs_sp_qty;           // Case/split quantity requiring catch weight
   varchar cs_sp[3];          // Case or split indicator
   varchar seq[8];            // Sequence number
   ```

### Integration Points

1. **Warehouse Management System (SWMS):**
   - Integrates with float generation processes
   - Connects to product master maintenance
   - Links with order processing systems

2. **Labor Management:**
   - Supports catch weight recording labor standards
   - Provides data for productivity tracking
   - Enables time and motion studies

3. **Inventory Control:**
   - Feeds actual weights back to inventory systems
   - Supports catch weight adjustments
   - Enables variance reporting

### Supporting Libraries

1. **Oracle Integration:**
   - `ora_auto_connect()`: Database connection management
   - `oracle_retrieve_condition()`: Dynamic filtering
   - Read-only transaction mode for data consistency

2. **Internationalization Support:**
   - `init_globalisation()`: Multi-language label support
   - `get_language_date()`: Localized date formatting
   - Configurable report titles and field labels

3. **Utility Functions:**
   - `getopts()`: Command-line argument processing
   - `get_date_time_str()`: Formatted date/time generation
   - `strupr()`: String uppercase conversion

### Configuration Management

1. **Field Length Expansions:**
   - Customer ID: 7→10 characters (Project 212 - SCE042)
   - Pack Size: 12→15 characters (Project 212 - SCE057)
   - Enhanced product size unit support

2. **Report Formatting:**
   - Configurable line limits (default 52 lines)
   - Adjustable margins and spacing
   - Temperature zone display preferences

3. **Processing Options:**
   ```bash
   # Command-line usage examples:
   ob1rc -c "truck_no='T123'" -o /reports/catchweight.txt -l 60
   ob1rc -c "route_no='R456' AND comp_code='F'" -u operator1
   ```

### Performance Considerations

- **Read-Only Transactions:** Ensures data consistency during report generation
- **Cursor-Based Processing:** Handles large datasets efficiently
- **Optimized Sorting:** Uses indexed fields for performance
- **Memory Management:** Limits recap storage to prevent overflow (MAXIMUM_RECAP = 1000)

### Error Handling

1. **Database Errors:** Comprehensive SQL error reporting with statement details
2. **File I/O Errors:** Proper handling of output file creation and permissions
3. **Signal Handling:** Graceful shutdown on system signals (SIGHUP, SIGINT, SIGTERM)
4. **Parameter Validation:** Input validation for command-line arguments

### Audit and Compliance Features

- **Audit Trail:** Complete record of what items require catch weight recording
- **Regulatory Support:** Structured format supports weight verification compliance
- **Data Integrity:** Read-only processing ensures report accuracy
- **Traceability:** Complete item identification for tracking purposes