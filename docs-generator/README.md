# Pimcore Platform Documentation

Documentation is based on https://docusaurus.io/, for details on configuration, see their [docs](https://docusaurus.io/docs). 


## Configuration
Configuration of Pimcore documentation takes place in `platformVersions` variable of `./versionConfiguration.js`. 

- First level keys define available versions, array key is version name. 
- Version configuration options
  - `isVersion`: Set to `false` for `next` (= dev) version, set to `true` or all other actual versions. Version with the highest
    version number will be current version. 
  - `sidebar`: Define path to json file that defines sidebar for that version.  
  - `index`: Define path to md file that defines documentation index page of that version.  
  - `repos`: Defines all Pimcore repositories to be used for documentation generation. Key is repository name.
    - `branch`: Define branch/tag to be used for that version. 
    - `readmeEditBranch`: (optional) Define branch for editing on github (useful when doc is already on tag). If not defined, `branch` is used.  
    - `copyReadme`: Set to `true` if readme should be copied from repository root to documentation root.  
    - `targetDirectory`: Define target directory within the documentation.
    - `targetDirectories`: (optional, alternative to `targetDirectory`) Map source subdirectories to individual target directories. Each entry: `{ target: '...', sidebarGroup: '...' }`. Use when a single repo should produce multiple root-level doc sections.
    - `enterprise`: Define if repos is an enterprise repository.

## Build Pimcore Documentation

To build Pimcore documentation, follow two steps: 

#### 1) Prepare
Prepare step checks out all configured repositories, extracts docs and copies them to corresponding docusaurus directories. 

```bash
npm run checkout-doc-versions
```

#### 2) Build
Build docs for production use. 

```bash
npm run build
```

#### Debug / Develop
For development and debugging local webserver can be used by running


```bash
npm run start

# or serve built docs with 
npm run serve
```

## Documentation Refactoring Workflow

Environment for restructuring and improving docs directly in the source repositories, then verifying changes locally before pushing.

#### Step 1: Prepare feature branches
Creates a named branch across all repos for the latest configured version. Clones missing repos automatically and cleans up repos not in the current config.

```bash
npm run prepare-doc-branches <branch-name>
```

#### Step 2: Make changes
Edit documentation directly in `repos/<repo-name>/docs/` (or `/doc`).

#### Step 3: Dev mode with hot-reload (recommended)
Extracts docs, starts the Docusaurus dev server, and watches `repos/*/docs/` for changes, automatically syncing edits into `./docs/` so Docusaurus hot-reloads instantly.

```bash
npm run dev-docs
```

Iterate on step 2 while `dev-docs` is running, then push branches and create PRs.

#### Alternative: Manual build and preview
If you prefer separate steps instead of the watch mode:

```bash
npm run build-docs-from-repos
npm start
```

## Cross-Repository Links

Docs are aggregated from 50+ repos into a flat `docs/` directory. Each repo's docs land in a target directory configured in `versionConfiguration.js` (e.g., `pimcore/data-hub` maps to `0201_Datahub`). Cross-repo relative links break because source directory names differ from target names.

To link between repos, use **GitHub file URLs**:

```markdown
[Pimcore Core Framework](https://github.com/pimcore/pimcore/blob/2026.x/doc/README.md)
```

During the build, a preprocessor in `bin/modules/docs.mjs` detects these URLs, looks up the repo in `versionConfiguration.js`, and replaces them with correct relative paths. The branch in the URL is ignored during mapping. This runs automatically during `checkout-doc-versions`, `build-docs-from-repos`, and `dev-docs`.

## Lightbox Images

To render a documentation image as a clickable lightbox (opens full-size on click), add a `<div class="image-as-lightbox"></div>` immediately before the Markdown image:

```markdown
<div class="image-as-lightbox"></div>

![Alt text](./img/screenshot.png)
```

This is useful for screenshots and diagrams where the inline size is too small to read details.

## Custom Components

### VersionTimeline (`src/components/VersionTimeline/index.tsx`)

A React component that renders the Platform Version support timeline as an inline SVG. Used on the Platform Versions documentation page.

**Features:**
- Dynamic "Today" marker that updates automatically on each page load
- Bars are color-coded: green (active support), purple (LTS), gray (end of life), dashed outline (planned)
- Bars that exceed the visible timeline range are automatically clamped
- End dates render to the end of the given month (e.g. `2026-12` draws through December 31)
- Uses CSS custom properties (`--ifm-font-family-base`, `--ifm-font-color-base`) to match the site theme

**Usage in Markdown:**
```mdx
import VersionTimeline from '@site/src/components/VersionTimeline';

<VersionTimeline />
```

**Updating version data:** Edit the `VERSIONS` array in the component file. Each entry has:
- `version`: Display label (e.g. `'2025.4'`)
- `lts`: Whether this is an LTS release
- `activeStart` / `activeEnd`: Active support period in `YYYY-MM` format
- `ltsEnd`: End of LTS support period (only for LTS versions)
- `planned`: Set to `true` for unreleased versions (renders with dashed outline)

Adjust `TIMELINE_START` and `TIMELINE_END` constants to control the visible year range.

## New platform version release checklist
- [ ] Update versionConfiguration.js with repos and versions relevant for **current** version release
- [ ] Update versionConfiguration.js with repos and versions relevant for **next** version release
- [ ] Update [algolia crawler config](https://crawler.algolia.com/admin/crawlers/1774b609-b7b2-4c27-bc50-050b6dff3b68/configuration/edit) to include released and next version ie:
  ```java
  discoveryPatterns: [
    "https://docs.pimcore.com/platform/**",
    "https://docs.pimcore.com/platform/next/**",
    "https://docs.pimcore.com/platform/2023.1/**",
    "https://docs.pimcore.com/platform/2023.2/**",
    "https://docs.pimcore.com/platform/2023.3/**",
  ],
  ``` 
- [ ] Check [algolia crawler reindex run](https://crawler.algolia.com/admin/crawlers/1774b609-b7b2-4c27-bc50-050b6dff3b68/overview) for newly released version of docs