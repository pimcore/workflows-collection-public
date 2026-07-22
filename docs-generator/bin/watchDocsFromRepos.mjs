/**
 * File-watching dev mode: runs initial doc extraction, starts Docusaurus dev server,
 * and watches repo doc directories for changes — syncing them into ./docs/ so
 * Docusaurus hot-reloads automatically.
 *
 * Also watches versionConfiguration.js — when it changes, the config is reloaded
 * and docs are re-extracted (without deleting ./docs/ first, to avoid crashing
 * the Docusaurus dev server).
 *
 * Usage: node bin/watchDocsFromRepos.mjs
 *        npm run dev-docs
 */

import { copyDocsFromRepo, rewriteLinksInFile, rewriteAllGitHubLinks, rewriteGitHubLinksInFile, buildRepoMapping } from './modules/docs.mjs';
import { prepareVersionDocs } from './modules/docs.mjs';
import { getRepositoryConfig } from './modules/versionConfigHelper.mjs';
import * as fs from 'fs';
import fse from 'fs-extra';
import { spawn, execSync } from 'child_process';
import path from 'path';
import { createRequire } from 'module';
import chokidar from 'chokidar';

const require_ = createRequire(import.meta.url);
const CONFIG_PATH = path.resolve('versionConfiguration.js');

// ---------------------------------------------------------------------------
// Config loading (supports reload by clearing require cache)
// ---------------------------------------------------------------------------

function loadConfig() {
    delete require_.cache[CONFIG_PATH];
    const { platformVersions } = require_(CONFIG_PATH);
    const versionKeys = Object.keys(platformVersions);
    const latestVersionKey = versionKeys[versionKeys.length - 1];
    return { platformVersions, latestVersionKey, latestVersionConfig: platformVersions[latestVersionKey] };
}

// ---------------------------------------------------------------------------
// Initial setup
// ---------------------------------------------------------------------------

console.log('=== dev-docs: Initial doc extraction ===\n');

// Clean up versioned artifacts and stale caches so Docusaurus only sees "next" docs
for (const dir of ['./versioned_docs', './versioned_sidebars', './.docusaurus', './node_modules/.cache/rspack']) {
    if (fs.existsSync(dir)) {
        fse.emptyDirSync(dir);
        // Restore .gitkeep so git continues to track the directory
        if (dir === './versioned_docs' || dir === './versioned_sidebars') {
            fs.writeFileSync(dir + '/.gitkeep', '');
        }
    }
}
if (fs.existsSync('./versions.json')) {
    fs.unlinkSync('./versions.json');
}

let config = loadConfig();

const beforeCopyHook = (repoPath, repository) => {
    if (!fs.existsSync(repoPath)) {
        console.warn('WARNING: Repo not found at ' + repoPath + ' — skipping ' + repository);
        console.warn('  Run `npm run prepare-doc-branches <branch>` first to clone repos.');
        return false;
    }
};

// Initial extraction — uses prepareVersionDocs which deletes+recreates ./docs/
// This is safe here because Docusaurus hasn't started yet.
prepareVersionDocs(config.latestVersionConfig, config.latestVersionKey, [], { beforeCopyHook });

// ---------------------------------------------------------------------------
// Re-extraction that is safe to run while Docusaurus is running.
// Overwrites files in-place instead of deleting ./docs/ first.
// ---------------------------------------------------------------------------

function reExtractDocs() {
    console.log('\n=== dev-docs: Re-extracting docs (in-place) ===\n');

    const latestVersionConfig = config.latestVersionConfig;

    for (const repository in latestVersionConfig.repos) {
        if (!latestVersionConfig.repos.hasOwnProperty(repository)) continue;

        const repositoryConfig = getRepositoryConfig(latestVersionConfig, repository);
        const repoPath = './repos/' + repository.replace('pimcore/', '');

        if (beforeCopyHook(repoPath, repository) === false) continue;

        console.log('---- Processing repository ' + repository);
        copyDocsFromRepo(repoPath, repositoryConfig, './docs');
    }

    if (latestVersionConfig.index) {
        const destRootIndex = './docs/00_index.md';
        console.log('Copy root index file from ' + latestVersionConfig.index + ' to ' + destRootIndex);
        try {
            fse.copySync(latestVersionConfig.index, destRootIndex, { overwrite: true });
        } catch (err) {
            console.error(err);
        }
    }

    // Rewrite cross-repo GitHub URLs to relative paths
    rewriteAllGitHubLinks('./docs', latestVersionConfig);

    console.log('\n=== dev-docs: Re-extraction complete ===\n');
}

// ---------------------------------------------------------------------------
// Start Docusaurus dev server as a child process
// ---------------------------------------------------------------------------

console.log('\n=== dev-docs: Starting Docusaurus dev server ===\n');

const docusaurus = spawn('npx', ['docusaurus', 'start'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' },
});

docusaurus.on('error', (err) => {
    console.error('Failed to start Docusaurus:', err.message);
    process.exit(1);
});

// ---------------------------------------------------------------------------
// Watch infrastructure
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 100;
const pendingChanges = new Map(); // filePath → timeout
let fileWatchers = [];            // doc file watchers only (not config watcher)

function resolveDestFile(entry, relativePath) {
    if (entry.destDir) {
        return path.join(entry.destDir, relativePath);
    }
    // targetDirectories: match first path segment to a mapped source name
    for (const [srcName, conf] of Object.entries(entry.targetDirectories)) {
        if (relativePath === srcName || relativePath.startsWith(srcName + path.sep)) {
            const rest = relativePath.slice(srcName.length);
            return path.join('./docs', conf.target + rest);
        }
    }
    return null;
}

function handleChange(entry, srcFile) {
    const relativePath = path.relative(entry.srcDocDir, srcFile);
    if (!relativePath) return;

    const destFile = resolveDestFile(entry, relativePath);
    if (!destFile) return;

    const key = srcFile;
    if (pendingChanges.has(key)) {
        clearTimeout(pendingChanges.get(key));
    }

    pendingChanges.set(key, setTimeout(() => {
        pendingChanges.delete(key);

        if (fs.existsSync(srcFile) && fs.statSync(srcFile).isFile()) {
            try {
                fse.ensureDirSync(path.dirname(destFile));
                fse.copySync(srcFile, destFile, { overwrite: true });
                if (entry.targetDirectories && destFile.endsWith('.md')) {
                    rewriteLinksInFile(destFile, entry.targetDirectories);
                }
                if (destFile.endsWith('.md')) {
                    const repoMapping = buildRepoMapping(config.latestVersionConfig);
                    rewriteGitHubLinksInFile(destFile, './docs', repoMapping);
                }
                console.log(`[sync] ${entry.repoName}: ${relativePath}`);
            } catch (err) {
                console.error(`[sync error] ${relativePath}:`, err.message);
            }
        }
    }, DEBOUNCE_MS));
}

function handleUnlink(entry, srcFile) {
    const relativePath = path.relative(entry.srcDocDir, srcFile);
    if (!relativePath) return;

    const destFile = resolveDestFile(entry, relativePath);
    if (!destFile) return;

    const key = srcFile;
    if (pendingChanges.has(key)) {
        clearTimeout(pendingChanges.get(key));
    }

    pendingChanges.set(key, setTimeout(() => {
        pendingChanges.delete(key);

        try {
            if (fs.existsSync(destFile)) {
                fs.unlinkSync(destFile);
                console.log(`[delete] ${entry.repoName}: ${relativePath}`);
            }
        } catch (err) {
            console.error(`[delete error] ${relativePath}:`, err.message);
        }
    }, DEBOUNCE_MS));
}

function handleReadmeChange(entry) {
    const key = entry.repoPath + '/README.md';
    if (pendingChanges.has(key)) {
        clearTimeout(pendingChanges.get(key));
    }

    pendingChanges.set(key, setTimeout(() => {
        pendingChanges.delete(key);

        const srcReadme = entry.repoPath + '/README.md';
        if (!fs.existsSync(srcReadme)) return;

        try {
            fse.copySync(srcReadme, entry.destDir + '/README.md', { overwrite: true });
            execSync('sed -i "s#](.\\' + entry.docFolder + '#](.#g" README.md', { cwd: entry.destDir });
            console.log(`[sync] ${entry.repoName}: README.md (with link fix)`);
        } catch (err) {
            console.error(`[sync error] README.md:`, err.message);
        }
    }, DEBOUNCE_MS));
}

// ---------------------------------------------------------------------------
// Build watch entries from config and start/stop file watchers
// ---------------------------------------------------------------------------

function buildWatchEntries() {
    const entries = [];
    for (const repository in config.latestVersionConfig.repos) {
        if (!config.latestVersionConfig.repos.hasOwnProperty(repository)) continue;

        const repoConfig = getRepositoryConfig(config.latestVersionConfig, repository);
        const repoPath = './repos/' + repository.replace('pimcore/', '');

        if (!fs.existsSync(repoPath)) continue;

        let docFolder = '/docs';
        if (!fs.existsSync(repoPath + docFolder)) {
            docFolder = '/doc';
        }
        const srcDocDir = repoPath + docFolder;
        if (!fs.existsSync(srcDocDir)) continue;

        if (repoConfig.targetDirectories) {
            entries.push({
                repoName: repository,
                srcDocDir,
                targetDirectories: repoConfig.targetDirectories,
                docFolder,
                copyReadme: false,
                repoPath,
            });
        } else {
            entries.push({
                repoName: repository,
                srcDocDir,
                destDir: './docs/' + repoConfig.targetDirectory,
                docFolder,
                copyReadme: !!repoConfig.copyReadme,
                repoPath,
            });
        }
    }
    return entries;
}

async function closeFileWatchers() {
    // Cancel all pending sync timers so stale callbacks don't fire after rebuild
    for (const timer of pendingChanges.values()) {
        clearTimeout(timer);
    }
    pendingChanges.clear();

    for (const w of fileWatchers) {
        await w.close();
    }
    fileWatchers = [];
}

function startFileWatchers(entries) {
    for (const entry of entries) {
        const watchPaths = [entry.srcDocDir];
        if (entry.copyReadme) {
            const readmePath = entry.repoPath + '/README.md';
            if (fs.existsSync(readmePath)) {
                watchPaths.push(readmePath);
            }
        }

        const watcher = chokidar.watch(watchPaths, {
            ignoreInitial: true,
            awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
        });

        watcher.on('add', (filePath) => {
            if (entry.copyReadme && path.resolve(filePath) === path.resolve(entry.repoPath + '/README.md')) {
                handleReadmeChange(entry);
            } else {
                handleChange(entry, filePath);
            }
        });
        watcher.on('change', (filePath) => {
            if (entry.copyReadme && path.resolve(filePath) === path.resolve(entry.repoPath + '/README.md')) {
                handleReadmeChange(entry);
            } else {
                handleChange(entry, filePath);
            }
        });
        watcher.on('unlink', (filePath) => {
            handleUnlink(entry, filePath);
        });

        fileWatchers.push(watcher);
        const destLabel = entry.destDir || Object.values(entry.targetDirectories).map(c => './docs/' + c.target).join(', ');
        console.log(`  Watching ${entry.srcDocDir} → ${destLabel}`);
        if (entry.copyReadme) {
            console.log(`  Watching ${entry.repoPath}/README.md (README)`);
        }
    }
}

// ---------------------------------------------------------------------------
// Initial file watcher setup
// ---------------------------------------------------------------------------

console.log('\n=== dev-docs: Starting file watchers ===\n');

let watchEntries = buildWatchEntries();
startFileWatchers(watchEntries);

console.log(`\nWatching ${watchEntries.length} repositories. Edit files in repos/*/docs/ to hot-reload.`);

// ---------------------------------------------------------------------------
// Watch versionConfiguration.js for changes → in-place re-extraction
// Config watcher is kept separate from fileWatchers so it is never closed
// during a reload cycle.
// ---------------------------------------------------------------------------

let configReloadTimer = null;
let reloading = false;

const configWatcher = chokidar.watch(CONFIG_PATH, { ignoreInitial: true });
configWatcher.on('change', async () => {
    if (configReloadTimer) clearTimeout(configReloadTimer);
    configReloadTimer = setTimeout(async () => {
        configReloadTimer = null;

        if (reloading) return; // prevent concurrent reloads
        reloading = true;

        console.log('\n=== dev-docs: versionConfiguration.js changed — reloading ===\n');

        // Close file watchers first so they don't fire during extraction
        await closeFileWatchers();

        try {
            config = loadConfig();
        } catch (err) {
            console.error('[config reload] Failed to parse versionConfiguration.js:', err.message);
            console.error('[config reload] Fix the error and save again.');
            // Restore watchers with old config
            watchEntries = buildWatchEntries();
            startFileWatchers(watchEntries);
            reloading = false;
            return;
        }

        // Re-extract docs in-place (no delete of ./docs/)
        reExtractDocs();

        // Rebuild file watchers with new config
        watchEntries = buildWatchEntries();
        console.log('=== dev-docs: Restarting file watchers ===\n');
        startFileWatchers(watchEntries);
        console.log(`\nWatching ${watchEntries.length} repositories.\n`);
        reloading = false;
    }, 500);
});
// Store separately — NOT in fileWatchers — so it survives reload cycles
console.log(`  Watching ${CONFIG_PATH} (config reload)\n`);

// Clean up config watcher on shutdown
process.on('exit', () => configWatcher.close());

console.log('Press Ctrl+C to stop.\n');

// ---------------------------------------------------------------------------
// Clean shutdown
// ---------------------------------------------------------------------------

async function cleanup() {
    console.log('\n=== dev-docs: Shutting down ===');
    await closeFileWatchers();
    await configWatcher.close();
    if (docusaurus.pid) {
        docusaurus.kill('SIGTERM');
    }
    process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

docusaurus.on('close', (code) => {
    console.log('Docusaurus exited with code ' + code);
    cleanup();
});
