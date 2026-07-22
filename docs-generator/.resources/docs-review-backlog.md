# Documentation Review Backlog

Items collected from a comprehensive review of all refactored doc sections (platform-version, core-framework, 
studio-backend, studio-ui, generic-data-index, tinymce, quill, datahub, datahub-simple-rest, datahub-file-export, 
datahub-webhooks, data-importer, backend-power-tools, direct-edit, workflow-designer, copilot, copilot-showcases, 
workflow-automation-integration, portal-engine, statistics-explorer, headless-documents, asset-metadata-class-definitions, 
data-quality-management, ee-web-to-print, ee-customer-data-framework). 

These require manual verification, content rewrites, or decisions before they can be fixed.

## Admin Classic UI References Needing Rewrite

These references use legacy terminology or patterns from the old Admin Classic (ExtJS-based) interface. Each needs 
to be verified against Pimcore Studio and rewritten accordingly.

### Core Framework (repos/pimcore/doc/)

| File | Line(s) | What to fix |
|------|---------|-------------|
| `01_Documents/01_Templates/03_Editables/10_Date.md` | 7 | Links to ExtJS date format docs (sencha.com) - replace with neutral reference |
| `03_Objects/01_Object_Classes/01_Data_Types/25_Date_Types.md` | 14 | "the Pimcore admin UI will display the date and time" |
| `03_Objects/01_Object_Classes/01_Data_Types/65_Others.md` | 21, 26 | Two references to "admin UI" for Boolean Select |
| `03_Objects/01_Object_Classes/02_Layout_Elements/README.md` | 26-28 | References ExtJS layout components and links to Ext JS docs (sencha.com) - full rewrite needed |
| `03_Objects/README.md` | 5 | "Pimcore backend" should be "Pimcore Studio" |
| `04_Multi_Language_i18n/README.md` | 9, 43 | "translations for the admin interface" and "Pimcore backend UI localization" |
| `04_Multi_Language_i18n/03_Admin_Translations.md` | 3, 15, 42 | Three "admin interface" / "backend UI" references |
| `05_Content_Management_Features/02_Notes_and_Events.md` | 47 | Heading "Add Events in Pimcore backend UI" |
| `05_Content_Management_Features/05_Scheduling.md` | 19 | "In the Pimcore backend UI find the icon:" |
| `07_Workflow_Management/01_Configuration_Details/README.md` | 86, 92, 184, 283 | YAML comments reference "Pimcore backend" |
| `08_Development_Details/01_Configuration.md` | 5 | "written from the admin interface" |
| `08_Development_Details/04_Cache/01_Full_Page_Cache.md` | 9, 43, 45 | "disabled by default if you're logged into the admin interface", "the admin-UI", "used for the Pimcore admin UI" |
| `08_Development_Details/05_Debugging.md` | 35 | "For proper debugging of Pimcore backend UI" |
| `08_Development_Details/06_Extending_the_Pimcore_User.md` | 8 | "through the Pimcore backend UI" |
| `09_Development_Tools/03_Security_and_Authentication/README.md` | 5 | "the Pimcore admin UI uses the Security component" |
| `09_Development_Tools/03_Security_and_Authentication/05_Authenticator_Based_Security.md` | 3 | "authentication/authorization of the Pimcore admin UI" |
| `09_Development_Tools/09_Maintenance_Mode.md` | 3-4 | Two "admin UI" occurrences |
| `10_Extending_Pimcore/04_Pimcore_Bundle_Developers_Guide/README.md` | 3, 18 | "core Pimcore functionalities like the admin interface", "register JS and CSS files to be loaded with the admin interface" |
| `10_Extending_Pimcore/04_Pimcore_Bundle_Developers_Guide/01_Pimcore_Bundles/README.md` | 9, 13 | "register JS and CSS files to be loaded with the admin interface", "loading assets in the Admin UI" link text |
| `10_Extending_Pimcore/03_Custom_Extension_Guides/12_Modifying_Permissions_on_Object_Data.md` | 66 | Comment "data element that is send to Pimcore backend UI" (also "send" -> "sent") |
| `10_Extending_Pimcore/03_Custom_Extension_Guides/13_Custom_Layouts_Based_on_Object_Data.md` | 56 | Same comment as above |

### Platform Version (repos/platform-version/doc/)

| File | Line(s) | What to fix |
|------|---------|-------------|
| `03_Getting_Started/01_Installation/02_System_Setup_and_Hosting/01_Apache_Configuration.md` | 155 | mod_pagespeed section references `/admin` path |
| `03_Getting_Started/01_Installation/02_System_Setup_and_Hosting/02_Nginx_Configuration.md` | 112-115, 130, 361-364, 375 | `/admin/external` location blocks and `/admin` exclusion patterns - verify if still needed |
| `03_Getting_Started/01_Installation/02_System_Setup_and_Hosting/06_Additional_Tools_Installation.md` | 96-97 | Menu path `Tools > System Info & Tools > System-Requirements Check` - verify against Studio |
| `03_Getting_Started/01_Installation/02_System_Setup_and_Hosting/08_Performance_Guide.md` | 164 | "go to Document > Settings > Static Page Generator" - verify against Studio |
| `03_Getting_Started/03_Create_a_First_Project/03_Data_Objects.md` | 10, 26-31 | "Go to Settings > Object > Classes" and class editor step-by-step instructions - Admin Classic patterns |
| `03_Getting_Started/03_Create_a_First_Project/04_Documents.md` | 160, 285 | `/bundles/pimcoreadmin/img/` asset path (broken in Studio); controller assignment UI may differ |

### Studio UI (repos/studio-ui-bundle/doc/)

| File | Line(s) | What to fix |
|------|---------|-------------|
| `03_Configuration_and_Administration/03_Perspectives/01_Widgets.md` | 78, 136, 193 | `/bundles/pimcoreadmin/img/` icon paths in YAML examples - verify if still valid |
| `03_Configuration_and_Administration/03_Perspectives/02_Perspectives.md` | 105 | Same `/bundles/pimcoreadmin/img/` icon path |
| `03_Configuration_and_Administration/02_Users_and_Roles/README.md` | 56 | "Seemode" - verify if this feature exists in Studio |
| `03_Configuration_and_Administration/02_Users_and_Roles/README.md` | 111 | "custom layouts" reference without context/link |

### Studio Backend (repos/studio-backend-bundle/doc/)

| File | Line(s) | What to fix |
|------|---------|-------------|
| `04_Development_Details/02_API_Testing.md` | 28 | "Pimcore Admin UI: http://localhost:6001/admin" - may need updating to /pimcore-studio |

---

## Admin Classic Code Examples Needing Complete Rewrite

These contain ExtJS / Admin Classic JavaScript patterns that are incompatible with Pimcore Studio's React-based architecture.

### Core Framework (repos/pimcore/doc/)

| File | Description |
|------|-------------|
| `10_Extending_Pimcore/03_Custom_Extension_Guides/14_Open_By_External_Id.md` (lines 30-71) | Entire JS example uses `Ext.MessageBox.prompt`, `Ext.Ajax.request`, `Ext.decode`, `pimcore.helpers.openElement`, `pimcore.globalmanager.get("layout_toolbar")`, `new Ext.util.KeyMap` |
| `10_Extending_Pimcore/03_Custom_Extension_Guides/11_Adding_Button_to_Object_Editor.md` (line 29) | `pimcore.layout.refresh()` is Admin Classic JS |
| `10_Extending_Pimcore/03_Custom_Extension_Guides/05_Adding_Object_Layout_Types.md` (lines 21, 30) | GitHub links to `admin-ui-classic-bundle/tree/1.x/public/js/pimcore/object/...` and ExtJS element references |
| `10_Extending_Pimcore/03_Custom_Extension_Guides/04_Adding_Object_Datatypes.md` (lines 22, 33) | GitHub links to `admin-ui-classic-bundle/.../object/classes/data` and `.../object/tags` |
| `10_Extending_Pimcore/03_Custom_Extension_Guides/01_Adding_Asset_Types.md` (line 33) | GitHub link to `admin-ui-classic-bundle/.../js/pimcore/asset` |
| `10_Extending_Pimcore/01_Events/README.md` (line 37) | Link to `admin-ui-classic-bundle/.../AdminEvents.php` |
| `10_Extending_Pimcore/03_Custom_Extension_Guides/10_Custom_Icons_and_Tooltips.md` (line 17) | Link to `admin-ui-classic-bundle/.../AdminEvents.php` |
| `10_Extending_Pimcore/03_Custom_Extension_Guides/12_Modifying_Permissions_on_Object_Data.md` (line 3) | Link to `admin-ui-classic-bundle/.../AdminEvents.php` |
| `10_Extending_Pimcore/03_Custom_Extension_Guides/13_Custom_Layouts_Based_on_Object_Data.md` (line 3) | Link to `admin-ui-classic-bundle/.../AdminEvents.php` |
| `05_Content_Management_Features/06_GDPR_Data_Extractor.md` (lines 64, 74) | References `Ext.Panel` return type and links to `admin-ui-classic-bundle/.../DataProviderInterface.php` |

---

## Code Examples Needing Verification

These code snippets may have bugs, use deprecated APIs, or need updating.

### Studio Backend (repos/studio-backend-bundle/doc/)

| File | Line(s) | Issue |
|------|---------|-------|
| `01_Architecture_Overview/01_Grid.md` | 69, 82, 98, 113, 130, 150 | JSON missing colon: `"columnFilters" [` should be `"columnFilters": [` |
| `01_Architecture_Overview/01_Grid.md` | 210, 289, 326, 537 | Trailing commas in JSON (invalid syntax) |
| `01_Architecture_Overview/01_Grid.md` | 267-296 | "changeChase" - verify if actual API key or typo for "changeCase" |
| `01_Architecture_Overview/01_Grid.md` | 293, 335 | Missing comma between `advancedColumns` and `transformers` arrays |
| `01_Architecture_Overview/02_Generic_Execution_Engine.md` | 37-42 | YAML `csv_settings` block appears under "Element XLSX Export" heading - misplaced |
| `03_Extending/01_Additional_and_Custom_Attributes.md` | 117 | `formated_path` event name - verify if actual API or typo for `formatted_path` |
| `03_Extending/01_Additional_and_Custom_Attributes.md` | 199, 201 | `pre_response.data_provider` appears as duplicate entry |
| `03_Extending/02_Extending_Grid_with_Custom_Columns.md` | 245 | PHP bug: `$value->setValue(...)` should be `$val->setValue(...)` |
| `03_Extending/02_Extending_Grid_with_Custom_Columns.md` | 248 | Missing semicolon: `return $value` should be `return $value;` |
| `03_Extending/03_Assets/01_Extending_Metadata_Adapters.md` | 54 | Return type `?int` should likely be `?array` |
| `03_Extending/03_Assets/01_Extending_Metadata_Adapters.md` | 71-74 | Missing `use` statements for `UserInterface` and `ElementInterface` |
| `03_Extending/04_Extending_Endpoints.md` | 21, 23 | TODO placeholders: `-- TODO ADD PAGE WITH RESPONSES --` and `-- TODO ADD PAGE WITH PARAMETERS --` |
| `03_Extending/07_Documents/01_Custom_Document_Types.md` | 213 | Missing closing `}` for class |
| `03_Extending/07_Documents/01_Custom_Document_Types.md` | 117, 179 | Interface name inconsistency: `EditableDataNormalizerInterface` vs `EditableDataInterface` |
| `03_Extending/08_Extending_Filters/README.md` | 68 | JSON missing colon (same pattern as Grid.md) |
| `03_Extending/08_Extending_Filters/README.md` | 82 | Unresolved placeholder: `[#LINK TO MAPPER]` |
| `03_Extending/09_Perspectives/01_Extending_Widgets.md` | 248 | Missing `P` in namespace: `imcore\Bundle\` should be `Pimcore\Bundle\` |
| `03_Extending/10_Extending_Updater_and_Patcher.md` | 89 | Missing `return` keyword: `'parentId';` should be `return 'parentId';` |
| `03_Extending/12_Extending_GDPR_Data_Providers.md` | 25, 35 | Method name inconsistency: `getRequiredPermissions()` vs `getRequiredPermission()` |
| `03_Extending/12_Extending_GDPR_Data_Providers.md` | 77 | Missing namespace and `use` imports in example class |
| `03_Extending/12_Extending_GDPR_Data_Providers.md` | 113-122 | Empty method bodies with declared return types (would cause PHP errors) |

### Core Framework (repos/pimcore/doc/)

| File | Line(s) | Issue |
|------|---------|-------|
| ~~`01_Documents/13_Adaptive_Design_Helper.md`~~ | ~~11~~ | ~~Fixed: `FrontendController` base class~~  |
| `01_Documents/01_Templates/04_Pimcore_Thumbnails.md` | 49, 54 | `getThumbnail('myThumbnail').getHref()` - `getHref()` may be deprecated, verify current API |
| `01_Documents/06_Navigation.md` | 222 | Bootstrap 4 `data-toggle` attributes - should be Bootstrap 5 `data-bs-toggle` |
| `02_Assets/02_Restricting_Public_Asset_Access.md` | 163-166 | Dead code: `throw` after unconditional return in if/else |
| `03_Objects/02_Working_with_Objects_via_PHP_API.md` | 151-152 | References Zend Framework 1 docs (EOL since 2016) |
| `03_Objects/02_Working_with_Objects_via_PHP_API.md` | 367 | Misleading HTML anchor `zendPaginatorListing` for Knp Paginator section |
| `03_Objects/03_External_System_Interaction.md` | 15 | Code shows Symfony Console Command but description says "Put the following script into /bin/example.php" |
| `03_Objects/01_Object_Classes/04_Additional_Class_Settings/05_Link_Generator.md` | 112 | `$d->getHref()` may be deprecated |
| `03_Objects/01_Object_Classes/04_Additional_Class_Settings/08_Preview_Generator.md` | 9 | "As of Pimcore 10.6" - outdated version reference |

### Platform Version (repos/platform-version/doc/)

| File | Line(s) | Issue |
|------|---------|-------|
| `03_Getting_Started/03_Create_a_First_Project/04_Documents.md` | 160 | `/bundles/pimcoreadmin/img/logo-claim-gray.svg` - asset path from removed Admin Classic bundle, will produce broken image |
| `02_Pimcore_Platform/01_Pimcore_Architecture.md` | 63 | PHP 8.5+ requirement - verify this is correct for 2026.1 target |
| `02_Pimcore_Platform/01_Pimcore_Architecture.md` vs `03_Getting_Started/.../01_System_Requirements.md` | 65 / 51 | MariaDB version mismatch: Architecture says 10.11+, System Requirements says >= 10.3 |

### Studio UI (repos/studio-ui-bundle/doc/)

| File | Line(s) | Issue |
|------|---------|-------|
| `04_Extending/02_Plugin_Development_Examples/06_Adding_Custom_Icons.md` | 12 | GitHub link may point to wrong example directory (`custom-widgets` instead of `custom-icons`) |
| `04_Extending/01_Getting_Started_with_Your_First_Plugin.md` | 19, 25 | React version pinned to 18.3.x - will become outdated |

---

## Through-line / Navigation Issues

### Dead-end pages missing "Next Steps"

| File | Issue |
|------|-------|
| `platform-version: 01_Pimcore_Overview/04_Pimcore_Community.md` | No forward navigation to Platform or Getting Started chapters |
| `platform-version: 03_Getting_Started/.../08_Performance_Guide.md` | No next steps at end of System Setup section |
| `platform-version: 03_Getting_Started/.../03_Advanced_Installation_Topics/README.md` | No TOC linking to sub-pages |
| `studio-ui: 02_Installation.md` | No next steps after installation |
| `studio-ui: 01_Architecture_Overview/01_SDK_Overview/07_Dynamic_Types.md` | No link to practical example |

### Links to backlog files (active docs linking to parked content)

These are links from active docs to `doc/backlog/` files in the core framework repo. Readers following these links land on content that's not in the main doc navigation. Each needs to be either replaced with inline content, linked to the correct new location, or removed.

| File | Target |
|------|--------|
| ~~`pimcore: 01_Documents/README.md`~~ | ~~Fixed: uses cross-repo GitHub URL now~~ |
| `pimcore: 03_Objects/01_Object_Classes/README.md` (line 4) | `../../backlog/01_Getting_Started/07_Create_a_First_Project.md` |
| `pimcore: 01_Documents/05_Routing_and_URLs/README.md` (line 44) | `../../backlog/02_MVC_Custom_Routes.md` |
| `pimcore: 01_Documents/08_Working_with_Sites.md` (line 19) | `../backlog/02_MVC_Custom_Routes.md` |
| `pimcore: 03_Objects/02_Working_with_Objects_via_PHP_API.md` (line 73) | `../backlog/02_MVC_Custom_Routes.md` |
| `pimcore: 05_Content_Management_Features/05_Scheduling.md` (line 13) | `../backlog/23_Installation_and_Upgrade/...` |
| `pimcore: 08_Development_Details/01_Configuration.md` (lines 50, 72, 96) | Three links to backlog (Config Environments, Directory Structure) |
| `pimcore: 10_Extending_Pimcore/04_.../README.md` (line 100) | `../../backlog/06_Event_Listener_UI.md` |
| `pimcore: 10_Extending_Pimcore/01_Events/README.md` (line 9) | `../../backlog/06_Event_Listener_UI.md` |
| `pimcore: 10_Extending_Pimcore/03_.../11_Adding_Button_to_Object_Editor.md` (line 12) | `../../backlog/06_Event_Listener_UI.md` |
| `pimcore: 10_Extending_Pimcore/03_.../14_Open_By_External_Id.md` (line 16) | `../../backlog/06_Event_Listener_UI.md` |
| `pimcore: 10_Extending_Pimcore/04_.../01_Pimcore_Bundles/README.md` (line 13) | `../../../backlog/13_Loading_Admin_UI_Assets.md` |
| `pimcore: 02_Assets/02_Restricting_Public_Asset_Access.md` (lines 57, 107) | `../backlog/23_.../02_Nginx_Configuration.md` |
| `pimcore: 02_Assets/03_Accessing_Assets_via_WebDAV.md` (line 10) | `../backlog/23_.../02_Nginx_Configuration.md` |
| `pimcore: 11_Deployment_Recommendations/README.md` (line 16) | `../backlog/03_Configuration_Environments.md` |
| `pimcore: 11_Deployment_Recommendations/02_Deployment_Tools.md` (lines 9, 90) | Two links to backlog |
| `pimcore: 01_Documents/01_Templates/02_Twig_Extensions/README.md` (line 187) | `../../../backlog/21_Glossary.md` |
| `pimcore: 08_Development_Details/04_Cache/README.md` (line 119) | `../../backlog/15_Magic_Parameters.md` |
| `pimcore: 08_Development_Details/03_Database_Model.md` (line 44) | `../backlog/21_Glossary.md` |
| `pimcore: 10_Extending_Pimcore/03_.../07_Maintenance_Tasks.md` (line 4) | `../../backlog/01_Getting_Started/...` |
| `pimcore: 08_Development_Details/10_CLI_and_Pimcore_Console.md` (line 10) | `../backlog/11_Console_CLI.md` |
| `pimcore: 06_Reporting/03_Dashboards.md` (line 5) | Wrong URL format for studio-backend-bundle docs |

---

## Correctness Issues Needing Decision

| File | Issue |
|------|-------|
| `platform-version: 02_.../04_Platform_Versions/README.md` (line 58) | 2023.3 LTS expired December 2025 - add "(expired)" label? |
| `platform-version: 02_.../01_Pimcore_Architecture.md` (line 63) | PHP 8.5+ - verify correct for 2026.1 |
| `platform-version: 03_.../01_System_Requirements.md` (line 51) | MariaDB >= 10.3 contradicts Architecture doc's 10.11+ |
| `platform-version: 03_.../01_System_Requirements.md` (line 105) | "All versions > 3 are supported" for Redis is vague |
| `studio-backend: 01_.../02_Generic_Execution_Engine.md` (line 10) | Links to pimcore `11.x` branch - should be `2026.x`? |
| `studio-ui: 03_.../03_Perspectives/01_Widgets.md` | YAML config key is still `custom_views` - add explanatory note? |
| `studio-ui: 03_.../03_Perspectives/02_Perspectives.md` | `customview` type value in elementTree - add explanatory note? |

---

## Generic Data Index Bundle (repos/generic-data-index-bundle/)

### Code Examples Needing Verification

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/01_Installation/02_Upgrade.md` | 35 | Removed deprecated `SearchFailedException` replacement points to same `OpenSearch` namespace that was removed - verify correct replacement class |
| `doc/04_.../08_Permissions_Workspaces/README.md` | 9-11 | `PermisisonEvent` typo in class names - contradicts correct `PermissionEvent` on line 28. Verify actual class name in code |
| `doc/04_.../08_Permissions_Workspaces/README.md` | 18 | `namespace AppBundle\EventSubscriber` - legacy Symfony 3 namespace, should be `App\EventSubscriber` |
| `doc/04_.../06_Default_Search_Models/README.md` | 5-6 | Deprecation notice says "will be removed in version 2.0" but bundle is on 2.x - remove or update |
| `doc/05_.../06_Extend_Search_Index.md` | 75-76 | `namespace AppBundle\EventListener` - legacy namespace |
| `doc/05_.../06_Extend_Search_Index.md` | 68 vs 105 | File size threshold mismatch: comment says "< 300KB" but code calculates `3*1000` = 3KB |
| `doc/05_.../06_Extend_Search_Index.md` | 153-154 vs 188 | Description says "User Owner field" but code indexes `numberOfVariants` - mismatch |
| `doc/05_.../06_Extend_Search_Index.md` | 162-163 | Example 2 imports `Asset\ExtractMappingEvent` and `Asset\UpdateIndexDataEvent` but example is for data objects - wrong imports |
| `doc/04_.../05_Search_Modifiers/README.md` | 19-35 | Mixed GitHub branch references (`2.x` vs `2.0`) in filter links - standardize |
| `doc/04_.../05_Search_Modifiers/README.md` | 101 | Wrong backtick character (acute accent ´ instead of backtick `) before `__invoke` |

### Admin Classic UI References

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/01_Installation/02_Upgrade.md` | 44 | "Pimcore Classic bundle permission system" - clarify if this is historical or needs updating |

---

## TinyMCE Bundle (repos/ee-tinymce-bundle/)

### Admin Classic UI References / Structural Issues

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/03_Global_Configuration_Admin_Ui.md` | entire file | Admin Classic-specific configuration page. Contains ExtJS `Class.create` patterns, `getEditmodeJsPaths()`/`getJsPaths()` methods. Decide: mark as legacy, or remove? |
| `doc/03_Global_Configuration_Admin_Ui.md` | 6, 70 | Outdated docs URLs: `pimcore.com/docs/pimcore/current/...` format (old, likely broken) |
| `doc/03_Global_Configuration_Admin_Ui.md` | 100-120 | "Loading additional TinyMCE plugins" section is useful but buried in Admin Classic page - should be in its own page or in README so Studio users can find it |
| `doc/03_Global_Configuration_Admin_Ui.md` | 104 | "(Note: Included since Pimcore 11.4)" - outdated version note |
| `README.md` | 65 | Link text says "admin-ui-classic-bundle" - consider labeling as "(legacy)" |
| `doc/01_Installation.md` vs `doc/01_Installation/README.md` | all | Duplicate files with identical content - one should be removed |
| `doc/02_Global_Configuration_Studio_Ui.md` | all | Entire page is a single link-out sentence with no context - consider expanding or inlining |

### Code Examples Needing Verification

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/03_Global_Configuration_Admin_Ui.md` | 48-61 | `AbstractPimcoreBundle` with `getEditmodeJsPaths()` / `getJsPaths()` - verify these methods still exist |
| `doc/03_Global_Configuration_Admin_Ui.md` | 14-32 | JavaScript code blocks missing language identifiers (no syntax highlighting) |

---

## Quill Bundle (repos/quill-bundle/)

### Admin Classic UI References / Structural Issues

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/02_Global_Configuration_Admin_Ui.md` | entire file | Admin Classic-specific configuration page. Decide: mark as legacy, or remove? |
| `doc/02_Global_Configuration_Admin_Ui.md` | 11-13, 27 | `{ menubar: true }` config example is a TinyMCE option, NOT a Quill option. Quill has no menubar concept. Code will have no effect. Text says "default menubar from Quill" which is factually wrong |
| `doc/02_Global_Configuration_Admin_Ui.md` | 6-7 | `Resources/public` directory path is legacy Symfony 3 convention |
| `doc/02_Global_Configuration_Admin_Ui.md` | 36 | "your editmode.js and startup.js created before was saved to" - grammar fix needed |
| `doc/02_Global_Configuration_Admin_Ui.md` | 1, 65 | Heading hierarchy starts at h5 (`#####`) - should be h1 or h2 |
| `doc/03_Global_Configuration_Studio_Ui.md` | all | Entire page is 3 lines - a single link-out. Consider expanding or inlining |
| `doc/03_Global_Configuration_Studio_Ui.md` | 1 | Same h5 heading hierarchy issue |
| `README.md` | 68-70 | `#####` heading for "Global Configuration" is unusually deep |
| `doc/01_Migration_to_Quill.md` | 28 | "Change the twig and public configs according to config options" - too vague, no specific guidance |

### Code Examples Needing Verification

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/02_Global_Configuration_Admin_Ui.md` | 11, 27 | `{ menubar: true }` is a TinyMCE option copied to Quill docs - must be replaced with actual Quill config |
| `doc/02_Global_Configuration_Admin_Ui.md` | 48, 55 | `getEditmodeJsPaths()` has return type but `getJsPaths()` does not - inconsistent |

---

## Datahub Bundle (repos/data-hub/)

### Outdated Links Needing Update

| File | Line(s) | Issue |
|------|---------|-------|
| `10_GraphQL/` (multiple files) | various | 15+ links to `pimcore.com/docs/pimcore/current/Development_Documentation/...` (Pimcore 6.x era doc URLs) - need updating to current doc structure or removing |
| `10_GraphQL/04_Query/16_Add_Custom_Query_Operator.md` | various | Links to old doc paths |
| `10_GraphQL/04_Query/15_Add_Custom_Query_Datatype.md` | various | Links to old doc paths |
| `10_GraphQL/07_Mutation/25_Add_Custom_Mutation_Datatype.md` | various | Links to old doc paths |

### Code Examples Needing Verification

| File | Line(s) | Issue |
|------|---------|-------|
| `10_GraphQL/10_Events.md` | various | Event listener examples - verify event class names and method signatures against current API |
| `10_GraphQL/01_Configuration/04_Custom_Permissions.md` | various | Permission configuration code - verify against current Datahub API |

---

## Datahub Simple REST Bundle (repos/data-hub-simple-rest/)

### Code Examples Needing Verification

| File | Line(s) | Issue |
|------|---------|-------|
| Multiple files | various | Mixed GitHub branch references (`1.x` vs `2.x`) in links - standardize to current branch |
| `doc/README.md` | various | Documentation Overview links - verify all point to correct locations |

---

## Datahub File Export Bundle (repos/data-hub-file-export/)

### Admin Classic UI References

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/01_Installation/README.md` | various | References to Admin Classic bundle installation - verify if still needed or should reference Studio |

### Code Examples Needing Verification

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/10_Customize_and_Extend.md` | various | Custom exporter/transmitter examples - verify interfaces and method signatures against current API |
| `doc/15_Events.md` | various | Event listener example - verify event class names against current API |

---

## Datahub Webhooks Bundle (repos/data-hub-webhooks/)

### Code Examples Needing Verification

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/Example_Requests/README.md` | various | Example webhook payloads - verify field names and structure match current implementation |

---

## Data Importer Bundle (repos/data-importer/)

### Admin Classic UI References

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/03_Configuration/01_Extend_Custom_Strategies.md` | various | Contains ExtJS extension patterns for adding custom resolver strategies to the admin UI - needs complete rewrite for Pimcore Studio plugin system |
| `doc/01_Installation.md` | various | References Admin Classic bundle installation requirement - verify if still needed |

### Code Examples Needing Verification

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/03_Configuration/01_Extend_Custom_Strategies.md` | various | Custom strategy implementation examples - verify interfaces and registration against current API |
| `doc/03_Configuration/01_Extend_Custom_Strategies.md` | various | ExtJS JavaScript code for UI integration - incompatible with Pimcore Studio's React architecture, needs complete rewrite |

---

## Backend Power Tools Bundle (repos/backend-power-tools-bundle/)

### Admin Classic UI References

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/20_Alternative_Element_Trees/01_Work_With_AET/01_Configuration.md` | 80 | Reference to "Admin UI Classic Bundle" GitHub link - verify if still relevant or needs updating |

### Code Examples Needing Verification

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/20_Alternative_Element_Trees/06_Studio.md` | various | JSON examples may have additional syntax issues beyond the fixed missing colon |

---

## Direct Edit Bundle (repos/direct-edit/)

### Admin Classic UI References

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/01_Installation/04_Mercure_Setup.md` | 27 | "Pimcore admin interface" - should be "Pimcore Studio" |

---

## Workflow Designer Bundle (repos/workflow-designer/)

### Admin Classic UI / Terminology References

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/05_Workflow_Configuration/03_Workflow_Configuration_Editor.md` | 67-70, 86, 90 | Multiple "Pimcore backend" references - should be "Pimcore Studio" |
| `doc/01_Installation_and_Configuration.md` | 41 | "Pimcore backend users" - should be "Pimcore Studio users" or just "Users" |

### Outdated Links

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/05_Workflow_Configuration/03_Workflow_Configuration_Editor.md` | 30 | Outdated link: `pimcore.com/docs/pimcore/current/Development_Documentation/Workflow_Management/Support_Strategies.html` |
| `doc/05_Workflow_Configuration/03_Workflow_Configuration_Editor.md` | 39 | Outdated link: `pimcore.com/docs/pimcore/current/Development_Documentation/Workflow_Management/Marking_Stores.html` |

### Structural Issues

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/05_Workflow_Configuration/03_Workflow_Configuration_Editor.md` | multiple | Missing H2 level - heading hierarchy jumps from H1 to H3 |

---

## Copilot Bundle (repos/copilot-bundle/)

No admin classic or structural issues found. All quick fixes applied.

---

## Copilot Showcase Bundle (repos/copilot-showcase-bundle/)

### Terminology References

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/05_Included_Actions/20_Custom_Reports.md` | 3, 8 | "Pimcore backend" - should be "Pimcore Studio" |
| `doc/05_Included_Actions/README.md` | 9 | "Pimcore backend" - should be "Pimcore Studio" |

### Links Needing Verification

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/05_Included_Actions/01_Link_To_Parent.md` | 8 | External Pimcore docs link - verify URL is still valid |

---

## Portal Engine Bundle (repos/portal-engine/)

### Terminology References

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/15_Development_Documentation/10_Customize_Appearance/10_Customize_Frontend_Build.md` | 13 | "admin interface" - should be "Pimcore Studio" |

### Code Fence Consistency

| File | Line(s) | Issue |
|------|---------|-------|
| Multiple files | various | Inconsistent use of `yml` vs `yaml` in code fences - consider standardizing to `yaml` |

---

## Statistics Explorer Bundle (repos/statistics-explorer/)

### Structural Issues

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/07_Customizing/07_Customizing_Results.md` | 13, 23, 33, 43 | Heading hierarchy jumps from H1 to H4 (####) without intermediate levels |

---

## Headless Documents Bundle (repos/headless-documents/)

### Terminology References

| File | Line(s) | Issue |
|------|---------|-------|
| `README.md` | 11, 13, 17 | "Admin UI" (3 instances) - should be "Pimcore Studio" |
| `doc/02_Template_Configuration/README.md` | 19 | "Admin UI" - should be "Pimcore Studio" |

### Outdated Paths

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/02_Template_Configuration/08_Headless_Bricks.md` | 28 | `/bundles/pimcoreadmin/img/flat-color-icons/like.svg` icon path in YAML config - verify if still valid |

### Structural Issues

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/02_Template_Configuration/04_Layouts/README.md` | multiple | Heading hierarchy jumps from H1 to H3 without H2 |
| `doc/02_Template_Configuration/08_Headless_Bricks.md` | 10 | H3 without H2 parent |
| `doc/06_Configuration.md` | 7 | H3 without H2 parent |

---

## Asset Metadata Class Definitions Bundle (repos/asset-metadata-class-definitions/)

### Outdated Paths

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/05_Technical_Details.md` | 56 | `/bundles/pimcoreadmin/img/object-icons/02_red.svg` icon path - verify if still valid in Pimcore Studio |

---

## Data Quality Management Bundle (repos/data-quality-management-bundle/)

### Code Examples Needing Verification

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/10_Customization/01_Calculation_Rules.md` | 79, 82 | Documentation text refers to `--class` option but command uses `--classIds` - verify correct option name |

---

## Web-to-Print Bundle (repos/ee-web-to-print-bundle/)

### Terminology References

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/01_Installation/README.md` | 10 | "Pimcore Admin UI" - should be "Pimcore Studio" |
| `doc/90_Web2Print_Extending_Config_for_PDFX_conformance.md` | 3, 15 | "Pimcore backend UI" (2 instances) - should be "Pimcore Studio" |

### Consistency Issues

| File | Line(s) | Issue |
|------|---------|-------|
| Multiple files | various | Inconsistent PDFreactor naming: "PDFreactor", "pdfreactor", "PDF Reactor" - standardize to official branding |

### Structural Issues

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/90_Web2Print_Extending_Config_for_PDFX_conformance.md` | 23, 78 | H5 (#####) headings used where H4 (####) expected - heading hierarchy skip |

---

## Customer Data Framework (repos/ee-customer-data-framework/)

### Terminology References

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/02_Installation/README.md` | 47 | "Pimcore Admin UI" - should be "Pimcore Studio" |
| `doc/28_ListViews.md` | 3, 8 | "Pimcore backend UI" (2 instances) - should be "Pimcore Studio" |
| `doc/11_CustomerSegments.md` | 13 | "Pimcore backend UI" - should be "Pimcore Studio" |
| `doc/15_CustomerDuplicatesService.md` | 10 | "Pimcore backend UI" - should be "Pimcore Studio" |
| `doc/06_CustomerSaveManager.md` | 101 | "Pimcore backend" - should be "Pimcore Studio" |
| `doc/26_Webservice.md` | 9 | "admin interface" - should be "Pimcore Studio" |

### Outdated Links

| File | Line(s) | Issue |
|------|---------|-------|
| `doc/30_Personalization/README.md` | 17 | Outdated link: `pimcore.com/docs/5.1.x/User_Documentation/...` (Pimcore 5.x era) |
| `doc/02_Installation/README.md` | 12 | Outdated link: `pimcore.com/docs/pimcore/10.6/...` (Pimcore 10.x era) |

---

## pimcore/pimcore - 01_Documents

Items found during the 01_Documents chapter rework (2026-03-15) that need deeper review beyond quick fixes.

### Editables Needing Deeper Rewrite

The `03_Editables/` directory has ~30 pages. Quick terminology fixes (admin -> Pimcore Studio, demo references) were applied,
but several pages need more substantial updates:

| File | Issue |
|------|-------|
| `01_Documents/01_Templates/03_Editables/10_Date.md` | Links to ExtJS date format docs (sencha.com) - replace with neutral date format reference |
| `01_Documents/01_Templates/03_Editables/02_Areablock/02_Bricks.md` | Several code examples may need updating for current Pimcore API |
| `01_Documents/01_Templates/03_Editables/28_Renderlet.md` | Uses older patterns, verify renderlet still works as documented |

### Code Examples Needing Verification

| File | Issue |
|------|-------|
| `01_Documents/01_Templates/04_Pimcore_Thumbnails.md` (lines 49, 54) | `getHref()` may be deprecated - verify current API |
| `01_Documents/06_Navigation.md` (line 222) | Bootstrap 4 `data-toggle` attributes should be Bootstrap 5 `data-bs-toggle` |

### Links to Backlog Files (still active)

| File | Target |
|------|--------|
| `01_Documents/05_Routing_and_URLs/README.md` | `../../backlog/02_MVC_Custom_Routes.md` - Custom Routes page is still in backlog |
| `01_Documents/08_Working_with_Sites.md` | `../backlog/02_MVC_Custom_Routes.md` - same |
| `01_Documents/01_Templates/02_Twig_Extensions/README.md` | `../../../backlog/21_Glossary.md` - Glossary page still in backlog |
