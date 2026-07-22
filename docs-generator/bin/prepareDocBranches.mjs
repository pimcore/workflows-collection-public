/**
 * Creates/checks out a named branch in all repos for the latest configured version.
 *
 * Usage: node bin/prepareDocBranches.mjs <branch-name>
 */

import { resolveVersions, platformVersions } from './modules/versionConfigHelper.mjs';
import { cloneRepository as gitCloneRepository, fetchRepository, createBranch } from './modules/git.mjs';
import * as fs from 'fs';
import fse from 'fs-extra';

const branchName = process.argv[2];
if (!branchName) {
    console.error('Usage: node bin/prepareDocBranches.mjs <branch-name>');
    process.exit(1);
}

// Get the latest version (last key in platformVersions — the "next" version)
const versionKeys = Object.keys(platformVersions);
const latestVersionKey = versionKeys[versionKeys.length - 1];
const latestVersionConfig = platformVersions[latestVersionKey];

console.log('Using version config: ' + latestVersionKey);
console.log('Branch name: ' + branchName);
console.log('');

// Build expected repo directory names
const expectedRepoDirs = new Set();
for (const repository in latestVersionConfig.repos) {
    if (latestVersionConfig.repos.hasOwnProperty(repository)) {
        expectedRepoDirs.add(repository.replace('pimcore/', ''));
    }
}

// Cleanup: remove repos not in latest version config
const reposDir = './repos';
if (fs.existsSync(reposDir)) {
    const existingDirs = fs.readdirSync(reposDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    const cleanedUp = [];
    for (const dir of existingDirs) {
        if (!expectedRepoDirs.has(dir)) {
            console.log('Removing stale repo: ' + dir);
            fse.removeSync(reposDir + '/' + dir);
            cleanedUp.push(dir);
        }
    }

    if (cleanedUp.length > 0) {
        console.log('\nCleaned up ' + cleanedUp.length + ' stale repo(s): ' + cleanedUp.join(', '));
    } else {
        console.log('No stale repos to clean up.');
    }
} else {
    fs.mkdirSync(reposDir);
}

console.log('');

// Clone/fetch and create branches
const results = [];
for (const repository in latestVersionConfig.repos) {
    if (latestVersionConfig.repos.hasOwnProperty(repository)) {
        const repoDir = repository.replace('pimcore/', '');
        const repoPath = reposDir + '/' + repoDir;

        console.log('\n---- ' + repository);

        if (!fs.existsSync(repoPath)) {
            gitCloneRepository(reposDir, repository);
        }

        fetchRepository(repoPath);
        const result = createBranch(repoPath, branchName);
        results.push({ repo: repository, ...result });
    }
}

// Summary
console.log('\n\n===================================================================================');
console.log(' Summary');
console.log('===================================================================================');
for (const r of results) {
    console.log('  ' + r.repo + ': ' + r.action + ' branch "' + branchName + '"');
}
