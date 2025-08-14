# SWMS (Sysco Warehouse Management System) - System Overview

## Introduction

SWMS (Sysco Warehouse Management System) is the core warehouse management platform used by Sysco Corporation to manage warehouse operations across their distribution centers. SWMS handles all aspects of warehouse operations including receiving, inventory management, order processing, shipping, labor management, and seamless integration with automation systems and ERP platforms.

**Organization:** Sysco Corporation - Supply Chain and Merchandising Division  
**Team:** SWMS Modernization Team  
**Contact:** swmsmodernization@Corp.sysco.com  
**Team Lead:** ppat5604@sysco.com

## Purpose and Business Domain

SWMS serves as the central nervous system for Sysco's warehouse operations, managing the complex flow of food service products through distribution centers. The system orchestrates:

- **Inventory Tracking:** Real-time monitoring of product location, quantities, and status across warehouse zones
- **Receiving Operations:** Purchase order processing, quality control, license plate generation, and putaway optimization
- **Order Fulfillment:** Pick path optimization, selection processing, load building, and shipping confirmation
- **Labor Management:** Task assignment, performance tracking, productivity standards, and incentive calculations
- **Integration Hub:** Seamless communication with ERP systems, automation equipment, transportation systems, and third-party applications
- **Operational Intelligence:** Comprehensive reporting and analytics for operational and business decision-making

## Core Features and Capabilities

### Inventory Management
- Real-time inventory tracking with location precision
- Multi-zone warehouse support (picking, reserve, staging, bulk)
- Status management (Available, Hold, Damaged, Allocated)
- Cycle counting and perpetual inventory reconciliation
- Temperature-controlled and date-sensitive product handling
- License plate and pallet tracking throughout warehouse operations

### Receiving and Putaway
- Purchase order validation and processing
- Quality control workflows and exception handling
- Cross-docking operations for high-velocity items
- Putaway optimization based on product characteristics and warehouse constraints
- Integration with automation systems (Symbotic/Matrix, miniload systems)
- Label printing and receiving documentation

### Order Processing and Fulfillment
- Advanced order optimization algorithms
- Pick path generation and route optimization
- Selection processing with voice/RF technology integration
- Load building and truck loading optimization
- Shipping confirmation and manifesting
- Returns processing and credit management

### Labor Management
- Work assignment and task prioritization
- Performance tracking and productivity measurement
- Labor standards management and maintenance
- Incentive pay calculations
- Resource allocation and workforce planning

### Automation Integration
- **Symbotic/Matrix Systems:** XML-based integration for automated storage and retrieval
- **Miniload Systems:** High-speed picking automation for case and split operations
- **Conveyor Systems:** Material handling and sorting automation
- **Voice/RF Systems:** Hands-free operation and real-time task management
- **Digital Signage:** Real-time operational displays and KPI dashboards

## System Architecture

### High-Level Architecture
SWMS follows a distributed, multi-tier architecture designed for high availability and scalability:

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                     │
│              Oracle Forms-based Applications               │
├─────────────────────────────────────────────────────────────┤
│                   Application Layer                        │
│            C/C++ Programs + PL/SQL Packages               │
├─────────────────────────────────────────────────────────────┤
│                  Integration Layer                         │
│               APCOM Messaging System                      │
├─────────────────────────────────────────────────────────────┤
│                   Database Layer                          │
│              Oracle 19c/12c Database                     │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Database:** Oracle 19c/12c with PL/SQL business logic
- **Programming Languages:** C/C++, PL/SQL, Pro*C, Java (unit testing)
- **Operating Systems:** AIX (primary), Linux (modernization path)
- **Integration:** APCOM messaging, staging tables, XML web services
- **Build System:** Make-based hierarchical build system
- **Version Control:** Git with Jenkins CI/CD pipeline
- **Communication Protocols:** TCP/IP, SNA LU6.2, FTP, HTTP/HTTPS

### Core Components

#### 1. APCOM (Application Communication)
**Location:** `/apcom/`
- Message queuing infrastructure for inter-system communication
- SNA LU6.2 protocol support for mainframe integration
- Transaction management and error handling
- Logging and monitoring capabilities
- Queue-based communication with external systems

#### 2. APLOG (Application Logging)
**Location:** `/aplog/`
- Centralized logging framework across all SWMS components
- Error tracking and performance monitoring
- Configurable log levels and destinations
- Integration with operational monitoring tools

#### 3. Business Applications (PGMS)
**Location:** `/pgms/`

**Communication Programs (`/pgms/com/`):**
- **swmstrwriter:** Processes inventory adjustments, receipts, and warehouse transactions
- **swmsorwriter:** Manages order processing transactions and shipment confirmations
- **swmspowriter:** Handles purchase order status updates and synchronization
- **swmsrtwriter:** Processes returns and credit transactions
- **swmsirwriter:** Manages item returns and adjustments
- **swmsupwriter:** Processes UPC and product information updates

**Functional Modules:**
- **inv/:** Inventory management and tracking programs
- **rcv/:** Receiving operations and putaway management
- **ord/:** Order processing and fulfillment systems
- **lm/:** Labor management and performance tracking
- **rtn/:** Returns processing and disposition
- **pur/:** Purchasing and procurement interfaces
- **sts/:** Integration with Sysco Transportation System

#### 4. Database Schema
**Location:** `/schema/`

**Core Tables:**
- **INV:** Inventory tracking (location, quantities, status, dates)
- **LOC:** Location master (warehouse slots, zones, characteristics)
- **PM:** Product master (item specifications, attributes, constraints)
- **TRANS:** Transaction logging (all warehouse activities)
- **ERM:** Expected Receipt Management (purchase orders)
- **ORDD:** Order details and line items
- **PUTAWAYLST:** Putaway task management
- **REPLENLST:** Replenishment task assignments

**Key PL/SQL Packages:**
- **pl_mx_stg_to_swms:** Matrix/Symbotic system integration
- **pl_xml_matrix_out:** XML processing for automation systems
- **pl_wh_move_utilities:** Warehouse move functionality
- **pl_lm_interface:** Labor management interface
- **pl_order_processing:** Order optimization and processing

#### 5. User Interface
**Locations:** `/frms/` (Forms), `/menu/` (Menus)
- Oracle Forms-based applications organized by functional area
- Role-based access control and security
- Real-time data display and transaction processing
- Integration with RF/voice systems for warehouse floor operations

#### 6. Reporting System
**Location:** `/rpts/`
- Comprehensive operational and analytical reporting
- Performance dashboards and KPI monitoring
- Regulatory compliance reporting
- Integration with business intelligence tools

## Key Technologies and Frameworks

### Database Technologies
- **Oracle Database:** Primary data repository with advanced features
- **PL/SQL:** Business logic implementation and data processing
- **Pro*C:** Embedded SQL in C programs for high-performance operations
- **Oracle Forms:** User interface development platform

### Integration Technologies
- **APCOM:** Proprietary messaging system for reliable communication
- **XML/Web Services:** Modern integration protocols for new systems
- **Staging Tables:** Database-based integration for ERP systems
- **File Transfer:** FTP and secure file transfer protocols

### Automation Integration
- **Symbotic/Matrix:** Advanced robotics and automated storage systems
- **Miniload:** High-speed automated case picking systems
- **Voice Technology:** Hands-free operation for warehouse workers
- **RF Systems:** Real-time data capture and communication

## Deployment Environment and Runtime

### Environment Topology
- **Development:** Developer workstations with local Oracle instances
- **Test:** Integrated testing environment with full system integration
- **Staging:** Pre-production validation environment
- **Production:** High-availability multi-site deployment

### Runtime Characteristics
- **24/7 Operations:** Continuous operation supporting multiple shifts
- **High Throughput:** Processing thousands of transactions per hour
- **Real-time Processing:** Immediate inventory and status updates
- **Fault Tolerance:** Automatic failover and recovery mechanisms
- **Scalability:** Horizontal scaling to support multiple warehouses

### Build and Deployment
- **Continuous Integration:** Jenkins-based automated build pipeline
- **Version Management:** Git-based source control with branching strategies
- **Configuration Management:** Environment-specific configurations
- **Automated Testing:** Unit testing with JUnit and Spring framework

## Code Organization and Patterns

### Directory Structure
```
├── apcom/          # Application communication infrastructure
├── aplog/          # Centralized logging framework
├── pgms/           # Core business applications
│   ├── com/        # Communication and integration programs
│   ├── inv/        # Inventory management
│   ├── ord/        # Order processing
│   ├── rcv/        # Receiving operations
│   └── lm/         # Labor management
├── schema/         # Database schema and PL/SQL packages
├── frms/           # Oracle Forms user interfaces
├── menu/           # Menu systems and navigation
├── rpts/           # Reporting applications
├── configuration/ # Environment-specific configurations
└── unit-tests/     # Automated testing framework
```

### Naming Conventions
- **Programs:** Descriptive names indicating functionality (e.g., `swmstrwriter`, `swmsorwriter`)
- **Database Objects:** Prefixed by functional area (e.g., `pl_mx_*`, `pl_lm_*`)
- **Configuration:** Environment and OpCo-specific naming
- **Queues:** Two-character identifiers for APCOM queues (e.g., `OW`, `TR`)

### Development Patterns
- **Modular Design:** Functional separation with clear interfaces
- **Error Handling:** Comprehensive exception handling and logging
- **Transaction Management:** ACID compliance with rollback capabilities
- **Configuration-Driven:** Externalized configuration for flexibility

## Key Terms and Domain Concepts

### Warehouse Operations
- **LP (License Plate):** Unique identifier for pallets and containers
- **Putaway:** Process of storing received inventory in optimal locations
- **Pick Path:** Optimized route for order fulfillment
- **Replenishment:** Moving inventory from reserve to picking locations
- **Cross-Dock:** Direct transfer from receiving to shipping without storage

### Inventory Management
- **QOH (Quantity on Hand):** Current inventory quantity
- **SPC (Splits per Case):** Unit conversion factor
- **UOM (Unit of Measure):** Case, split, or other measurement units
- **ABC Classification:** Inventory categorization by velocity/value
- **Cycle Count:** Periodic inventory verification process

### System Integration
- **APCOM:** Application Communication message queuing system
- **ERM:** Expected Receipt Management (purchase orders)
- **STS:** Sysco Transportation System integration
- **Matrix/Symbotic:** Automated storage and retrieval systems
- **OpCo:** Operating Company (Sysco business unit)

### Data Concepts
- **TRANS:** Transaction logging table for all warehouse activities
- **CPV (Customer Preferred Vendor):** Vendor identifier for products
- **Zone:** Warehouse area classification (pick, reserve, staging)
- **Slot:** Individual storage location within the warehouse

## Getting Started Path

### For New Developers
1. **Environment Setup**
   - Set up Oracle database connectivity and development tools
   - Configure C/C++ compiler and Pro*C precompiler
   - Install required libraries and dependencies

2. **Code Exploration**
   - Start with `README.md` and `SWMS_Comprehensive_Guide.md`
   - Examine the makefile structure to understand build dependencies
   - Explore key PL/SQL packages in `/schema/plsql/`
   - Review communication programs in `/pgms/com/`

3. **Build and Test**
   - Run the makefile to build core components
   - Set up unit testing environment with `/unit-tests/`
   - Execute test cases to verify system functionality

4. **Integration Understanding**
   - Study APCOM messaging system in `/apcom/`
   - Review integration patterns with external systems
   - Understand database schema relationships

### For System Administrators
1. **Infrastructure Setup**
   - Configure Oracle database instances and connectivity
   - Set up APCOM messaging infrastructure
   - Configure environment-specific settings in `/configuration/`

2. **Deployment Process**
   - Understand Jenkins-based CI/CD pipeline
   - Configure environment promotion procedures
   - Set up monitoring and alerting systems

3. **Operations Management**
   - Learn APLOG monitoring and troubleshooting
   - Configure backup and recovery procedures
   - Understand performance tuning requirements

### For Business Analysts
1. **Functional Overview**
   - Study business process flows in each functional module
   - Understand integration points with other Sysco systems
   - Review reporting capabilities and KPI definitions

2. **Data Analysis**
   - Explore database schema and key business entities
   - Understand transaction flows and data lineage
   - Review audit trails and compliance features

3. **Requirements Management**
   - Study configuration management patterns
   - Understand customization and extensibility options
   - Review change management processes

## Documentation and Resources

### Primary Documentation
- **Wiki Spaces:**
  - [SWMS OPCO](https://syscobt.atlassian.net/wiki/spaces/SWMS/overview?homepageId=62523621)
  - [SWMS Modernization](https://syscobt.atlassian.net/wiki/spaces/SM/overview)

### Architecture Documentation
- [Component Diagram](https://syscobt.atlassian.net/wiki/spaces/SM/pages/1291234512/High-level+Architecture+Diagram+of+Each+Phase)
- [SWMS Components Overview](https://syscobt.atlassian.net/wiki/spaces/SM/pages/1895340517/SWMS+Components+-+One+Page)
- [Integration Architecture](https://syscobt.atlassian.net/wiki/spaces/SM/pages/1963721199/Integration+Architecture+-+Classic+SWMS+Opco)

### Build and Deployment
- **CI/CD Pipeline:** [Jenkins Build Pipeline](http://jenkins.swms-np.us-east-1.aws.sysco.net/job/swms-opco-build/)
- **Current Version:** 55.0 (from build.properties)
- **Unit Testing:** Gradle-based Java testing framework

---

This overview provides a foundation for understanding SWMS as a comprehensive warehouse management solution. The system's modular architecture, extensive integration capabilities, and robust operational features make it a critical component of Sysco's supply chain operations. For detailed implementation information, refer to the source code, database schema, and linked documentation resources.
