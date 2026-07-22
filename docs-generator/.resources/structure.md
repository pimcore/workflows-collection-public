Pimcore Documentation
# Pimcore Overview
## Pimcore Overview
### https://docs.pimcore.com/platform/Pimcore/Overview/
### https://learn.pimcore.com/module/1-introduction/learn?activity=16
## Pimcore UI
### https://learn.pimcore.com/module/2-pimcore-ui-overview/learn?activity=16
### basic concepts of the pimcore ui
### widgets, editors, perspectives, trees, ...
## Pimcore Data Elements
### https://learn.pimcore.com/module/3-pimcore-core-components-data-types/learn?activity=16
### documents, assets, data objects
# Pimcore Platform
## Pimcore Architecture
### https://docs.pimcore.com/platform/Pimcore/Getting_Started/Architecture_Overview
### adapt for studio and with additional bundles
## Platform Versions
### https://docs.pimcore.com/platform/Platform_Version/
## Pimcore Modules
### Overview of different Bundles / Extensions
## Pimcore Editions
### https://pimcore.com/en/products/edition/overview
## Updating Pimcore & Release Notes
### https://docs.pimcore.com/platform/Platform_Version/Release_Notes/
### Updating Pimcore
### BC Promise
# Getting Started
## Installation
### based on
#### https://docs.pimcore.com/platform/Pimcore/Getting_Started/Installation/Docker_Based_Installation
### also include
#### System Requirements
#### System Setup & Hosting/Infrastructure Topics
##### Apache Configuration
##### Nginx Configuration
##### File Permissions
##### File Storage Setup
##### Database Setup
###### How to Configure Pimcore To Use a Primary/Replica Database Connection
##### Additional Tools Installation
##### Multi-application setup
##### Performance Best-Practice Guide
##### Fix Performance Issues on Windows
#### Advanced Installation Topics
#### Links to specific Pimcore Modules
## Product Registration
### based on
#### https://docs.pimcore.com/platform/Pimcore/Getting_Started/Product_Registration
### also create
#### FAQ
## Create a first Project
### based on
#### https://docs.pimcore.com/platform/Pimcore/Getting_Started/Create_a_First_Project
### also include
#### Directory Structure
# Pimcore Core
## Core Framework
### Documents
#### Templates
##### Template Inheritance & Layouts
##### Twig Extensions
##### Editables
##### Pimcore Thumbnails
#### MVC in Pimcore
#### Controller
#### Predefined Document-Types
#### Routing & URLs
##### URLs Based on Documents and Pretty URLs
##### URLs Based on Redirects
#### Navigation
#### Document Inheritance
#### Working With Sites
#### Website Settings
#### Robots.txt
#### Sitemaps
#### Static Page Generator
#### Adaptive Design Helper
#### Working With Documents via PHP API
### Assets
#### Working With Thumbnails
##### Image Thumbnails
##### Video Thumbnails
##### Asset Document Thumbnails
#### Restricting Public Asset Access
#### Accessing Pimcore Assets via WebDAV
#### Working With Assets via PHP API
### Objects
#### Object Classes
##### Object Data Types
##### Layout Elements
##### Custom Layouts
##### Additional Class Settings
###### Composite Indices
###### Custom Icons for Objects
###### Data Inheritance and Parent Class
####### Extending Pimcore -> Parent Class for Objects
###### Using Interfaces and Traits
###### Link Generator
###### Locking Fields
###### Path Formatter
###### Preview Generator
###### Object Variants
#### Working With Objects via PHP API
#### External System Interaction
#### Customize Editing Interface
##### remove
#### Object Bricks vs Classification Store
### Multi Language i18n & Localization in Pimcore
#### Localize Your Documents
#### Shared Translations
#### Admin Translations
#### Multilanguage i18n Websites
#### Formatting Service
### Content Management Features
#### Versioning
##### Subtopic 1
#### Notes & Events
#### Tags
#### Glossary
##### remove
#### Properties
#### Scheduling
#### GDPR Data Extractor
#### Notifications
#### Auto Save Drafts
#### Object Data Inheritance in Action
### Reporting
#### Explain what concepts for Reporting we have
#### Custom Reports
#### Reference to Statisticsexplorer
#### Reference to Dashboards
### Workflow Management
#### Configuration Details
#### Marking Stores
#### Support Strategies
#### Modifying Pimcore Permissions Based On Workflow Places
#### Simple Workflow Tutorial
#### Workflow Reporting
#### Working With PHP API
### Administration & Configuration
### Development Details
#### Deployment Recommendations -> Configuration
#### Configuration
#### System Settings
#### Database Model
#### Cache
##### Full Page Cache (Output Cache)
##### Working With Runtime Cache
#### Debugging Pimcore
#### Magic Parameters
##### remove?
#### Extending the Pimcore User
#### Working With Sessions
##### Where To Store Sessions
#### Preview Scheduled Content
#### Testing
#### Commandline Interface
##### CLI and Pimcore Console
### Development Tools
#### Generic Execution Engine
#### Logging
##### Application logger
#### Security and Authentication
#### Cloning Elements
#### Email Framework
#### UUID Support
#### Settings Store
#### Migrations
#### Maintenance Mode
#### Static Helpers
### Extending Pimcore
#### Events
##### three levels
###### Core Framework Events
####### Events and Event Listeners
###### Studio Backend Events
###### Studio UI Events
###### Other Bundles
##### Event Listener UI
###### remove
#### Add Your Own Dependencies and Packages
#### Custom Extensions Guides
##### Adding Asset Types
##### Adding Document Types
##### Adding Document Editables
##### Adding Object Datatypes
##### Adding Object Layout Types
##### Add Your Own Permissions
##### Maintenance Tasks
##### Overriding Models / Entities in Pimcore
##### Custom Persistent Models
##### Custom Icons & Tooltips for Documents/Assets & Data Objects
##### Add a Button to Object Editor
##### Modifying Permissions Based on Object Data
##### Showing Custom Layouts Based on Object Data
##### Open By External Id
#### Pimcore Bundle Developer's Guide
##### Pimcore Bundles
###### Installers
##### Loading Service Definitions From Within a Bundle
##### Auto Loading Config and Routing Definitions
##### Bundle Collection
##### Loading Assets in the Admin UI
###### remove
#### Dependency Injection Tags
##### remove
#### Implement Your Own Search
##### remove
### Deployment Recommendations
#### Version Control Systems
#### Deployment Tools
#### Backup of Pimcore
#### Cleanup Data Storage
#### Security Concept
### Implementation Inspirations
#### Implementing Product Information Management
#### Build Role & Rights System for Frontends
#### How to Build a Custom REST API Endpoint
#### Integrating Commerce Data With Content
#### Using Pimcore Tags for Filtering in Frontend
#### Style Backend Depending on the Application Environment
##### remove
### Upgrade Notes
#### Updating Pimcore
## Studio Backend
### Features in a nutshell
### Architecture Overview
#### API Structure and Architecture
#### Grid
#### Generic Execution Engine
### Installation & Configuration
#### Mercure Setup
#### Studio User
#### Extending Notes
### Extending
#### Additional and Custom Attributes
#### Extending Grid with Custom Columns
#### Assets
##### Extending metadata adapters
#### Extending Endpoints
#### Data Objects
##### Field Definition Adapters
#### Extending OpenApi
#### Documents
##### custom document types
#### Extending Filters
##### Extending Search index filters
##### extending listing filters
#### Perspectives
##### Extending Perspectives
##### Extending Widgets
#### Extending Updated and Patcher
#### Extening via Events
#### Extending GDPR Data Providers
### Development Details
#### Dot Notation for Field Definitions
#### API Testing
## Studio Frontend
### Features in a nutshell
### Architecture Overview
#### SDK Overview
##### UI Components and Storybook
##### Plugin Architecture, Plugins and Modules
##### Services and Dependency Injection
##### Component Registry
##### Widget Manager
##### Context Menu Registry
##### Dynamic Types
##### RTK Query API
##### SDK Imports
#### PimcoreStudio Window API
### Installation
#### Installation of the Studio UI Bundle
### Configuration & Administration
#### Configuration of the Studio UI Bundle
##### Content Security Policy
##### Custom URL for the UI
##### Global Configuration
###### WYSIWYG Editor config
##### Including Additional CSS or JS Files
#### Users and Roles
##### Two Factor Authentication
#### Permission Analyzer
##### remove
#### Perspectives
##### Custom Views
###### Custom View Example Configuration
####### remove
###### aka Widgets
##### Perspectives
##### Perspective Example Configuration
###### remove
#### Appearance & Branding
##### remove
### Extending
#### Getting Started with your first plugin
#### Plugin Development Examples
##### How to Add a Main Navigation Entry
##### How to Add an Entry to the Left Sidebar
##### How to Add an Additional Button to the Asset Editor Toolbar
##### How to Use the Tab Manager
##### How to Use the Widget Manager
##### How to Add Custom Icons
##### How to Use Dynamic Types
##### How to Use API Data
##### How to Customize Context Menus
##### How to Create a Custom Listing
### Development Details
#### Studio UI Core Development
## Generic Data Index
## TinyMCE WYSIWYG Editor
## Quill WYSIWYG Editor
# Data Onboarding & Distribution
## Datahub
## Data Importer
## Datahub File Export
## Datahub Simple Rest API
## Datahub Webhooks
# Productivity & Automation
## Backend Power Tools
## Direct Edit
## Workflow Designer
## Copilot
## Copilot Showcases
## Workflow Automation Integration
# Portals & Dashboards
## Dashboards
## Portal Engine
## Statistics Explorer
# Advanced Data Management
## Headless Documents
## Enterprise Asset Metadata
## Data Quality Management
## Web to Print Module
### Rendering PDFs
## Customer Management Framework
# Marketing & Personalization
## Behavioral Targeting and Personalization
# Integrations
## OpenID Connect
## Translation Provider Interfaces
## Datahub Productsup
# E-Commerce Framework
# Pimcore Operations
## Pimcore PaaS
# Pimcore Best Practises
## https://docs.pimcore.com/platform/Pimcore/Best_Practice/