/**
 * Extracts docs from the current state of /repos/ (no git operations)
 * and prepares them for `npm run build`.
 *
 * Usage: node bin/buildDocsFromRepos.mjs
 */

import { platformVersions } from './modules/versionConfigHelper.mjs';
import { prepareVersionDocs } from './modules/docs.mjs';
import * as fs from 'fs';
import fse from 'fs-extra';
import { execSync } from 'child_process';

// Get the latest version (last key — the "next" / isVersion: false entry)
const versionKeys = Object.keys(platformVersions);
const latestVersionKey = versionKeys[versionKeys.length - 1];
const latestVersionConfig = platformVersions[latestVersionKey];

console.log('Building docs from repos for version: ' + latestVersionKey);
console.log('');

// Clean up previous build state so Docusaurus only sees the "next" docs
console.log('Cleaning up previous build state...');

if (fs.existsSync('./versioned_docs')) {
    fse.removeSync('./versioned_docs');
    console.log('  Removed versioned_docs/');
}
if (fs.existsSync('./versioned_sidebars')) {
    fse.removeSync('./versioned_sidebars');
    console.log('  Removed versioned_sidebars/');
}
if (fs.existsSync('./versions.json')) {
    fs.unlinkSync('./versions.json');
    console.log('  Removed versions.json');
}
if (fs.existsSync('./.docusaurus')) {
    fse.removeSync('./.docusaurus');
    console.log('  Removed .docusaurus/ cache');
}

console.log('');

// Build only the latest (next) version docs into ./docs/
let versionArray = [];
versionArray = prepareVersionDocs(latestVersionConfig, latestVersionKey, versionArray, {
    beforeCopyHook(repoPath, repository) {
        if (!fs.existsSync(repoPath)) {
            console.warn('WARNING: Repo not found at ' + repoPath + ' — skipping ' + repository);
            console.warn('  Run `npm run prepare-doc-branches <branch>` first to clone repos.');
            return false;
        }
    }
});

console.log('\nDocs extracted into ./docs/. Run `npm run build` or `npm start` to preview.');
