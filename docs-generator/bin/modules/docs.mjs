/**
 * Shared doc-extraction helpers used by checkoutDocVersions.mjs and buildDocsFromRepos.mjs.
 */

import { getRepositoryConfig } from './versionConfigHelper.mjs';
import * as fs from 'fs';
import fse from 'fs-extra';
import process from 'child_process';
import path from 'path';

/**
 * Default repo path resolver — strips 'pimcore/' prefix.
 * @param {string} reposPath - base repos directory (e.g. './repos')
 * @param {string} repository - full repo name (e.g. 'pimcore/data-hub')
 * @returns {string}
 */
function defaultRepoPathResolver(reposPath, repository) {
    return reposPath + '/' + repository.replace('pimcore/', '');
}

/**
 * Copies docs from a single repo into the target directory.
 *
 * @param {string} repoPath - path to the cloned repo (e.g. './repos/data-hub')
 * @param {Object} repositoryConfig - merged repo config from getRepositoryConfig
 * @param {string} destDir - base doc target directory (e.g. './docs' or './versioned_docs/version-X')
 */
export function copyDocsFromRepo(repoPath, repositoryConfig, destDir) {
    let docFolder = '/docs';
    if (!fs.existsSync(repoPath + docFolder)) {
        docFolder = '/doc';
    }
    const srcDir = repoPath + docFolder;

    if (repositoryConfig.targetDirectories) {
        for (const [srcName, config] of Object.entries(repositoryConfig.targetDirectories)) {
            const src = srcDir + '/' + srcName;
            const dest = destDir + '/' + config.target;
            console.log('Copy doc files from ' + src + ' to ' + dest);
            try {
                fse.copySync(src, dest, { overwrite: true });
            } catch (err) {
                console.error(err);
            }
        }

        // Rewrite cross-directory links in copied files
        for (const config of Object.values(repositoryConfig.targetDirectories)) {
            const targetPath = destDir + '/' + config.target;
            if (fs.existsSync(targetPath)) {
                if (fs.statSync(targetPath).isDirectory()) {
                    rewriteTargetDirectoryLinks(targetPath, repositoryConfig.targetDirectories);
                } else if (targetPath.endsWith('.md')) {
                    rewriteLinksInFile(targetPath, repositoryConfig.targetDirectories);
                }
            }
        }
        return;
    }

    const dest = destDir + '/' + repositoryConfig.targetDirectory;

    console.log('Copy doc files from ' + srcDir + ' to ' + dest);
    try {
        fse.copySync(srcDir, dest, { overwrite: true });
    } catch (err) {
        console.error(err);
    }

    if (repositoryConfig.copyReadme) {
        const srcReadme = repoPath + '/README.md';
        console.log('Copy README.md from ' + srcReadme + ' to ' + dest + '/README.md');
        try {
            fse.copySync(srcReadme, dest + '/README.md', { overwrite: true });
        } catch (err) {
            console.error(err);
        }

        console.log('Fixing README.md');
        let output = process.execSync('sed -i "s#](.' + docFolder + '#](.#g" README.md', { 'cwd': dest });
        console.log(output.toString());
    }
}

/**
 * Orchestrates doc extraction for a single platform version.
 *
 * @param {Object} platformVersionConfig - version config entry from platformVersions
 * @param {string} platformVersion - version name (e.g. '2025.1' or '2026.x')
 * @param {string[]} versionArray - accumulator for released version names
 * @param {Object} [options]
 * @param {string} [options.reposPath] - base repos directory (default: './repos')
 * @param {Function} [options.repoPathResolver] - custom (reposPath, repository) => path resolver
 * @param {Function} [options.beforeCopyHook] - called with (repoPath, repository, repositoryConfig) before copying; if it returns false, repo is skipped
 * @returns {string[]} updated versionArray
 */
export function prepareVersionDocs(platformVersionConfig, platformVersion, versionArray, options = {}) {
    const reposPath = options.reposPath || './repos';
    const resolveRepoPath = options.repoPathResolver || defaultRepoPathResolver;

    console.log('===================================================================================');
    console.log(' Preparing docs for platform version ' + platformVersion);
    console.log('===================================================================================');

    console.log('\nCleanup target directory');

    let docTargetDirectory = './docs';
    if (platformVersionConfig.isVersion) {
        versionArray.push(platformVersion);
        docTargetDirectory = './versioned_docs/version-' + platformVersion;
    }

    if (fs.existsSync(docTargetDirectory)) {
        fse.removeSync(docTargetDirectory);
    }
    fs.mkdirSync(docTargetDirectory);

    for (const repository in platformVersionConfig.repos) {
        if (platformVersionConfig.repos.hasOwnProperty(repository)) {
            const repositoryConfig = getRepositoryConfig(platformVersionConfig, repository);

            console.log('\n\n---- Processing repository ' + repository);

            const repoPath = resolveRepoPath(reposPath, repository);

            if (options.beforeCopyHook) {
                if (options.beforeCopyHook(repoPath, repository, repositoryConfig) === false) {
                    continue;
                }
            }

            copyDocsFromRepo(repoPath, repositoryConfig, docTargetDirectory);
        }
    }

    if (platformVersionConfig.index) {
        console.log('\nCopy root index file...');
        const destRootIndex = docTargetDirectory + '/00_index.md';
        console.log('Copy root index file from ' + platformVersionConfig.index + ' to ' + destRootIndex);
        try {
            fse.copySync(platformVersionConfig.index, destRootIndex, { overwrite: true });
        } catch (err) {
            console.error(err);
        }
    }

    if (platformVersionConfig.isVersion && platformVersionConfig.sidebar) {
        console.log('\nCopy sidebar file...');
        const destSidebar = './versioned_sidebars/version-' + platformVersion + '-sidebars.json';
        console.log('Copy sidebar.json from ' + platformVersionConfig.sidebar + ' to ' + destSidebar);
        try {
            fse.copySync(platformVersionConfig.sidebar, destSidebar, { overwrite: true });
        } catch (err) {
            console.error(err);
        }
    }

    // Rewrite cross-repo GitHub URLs to relative paths
    rewriteAllGitHubLinks(docTargetDirectory, platformVersionConfig);

    console.log('\n\n');

    return versionArray;
}

/**
 * Writes the sorted versions.json file.
 * @param {string[]} versionArray
 */
export function finalizeVersionsJson(versionArray) {
    console.log('Updating versions.json');
    versionArray.sort().reverse();
    fs.writeFileSync('./versions.json', JSON.stringify(versionArray));
}

/**
 * Builds a source→target name map from a targetDirectories config,
 * and a regex that matches any source name as a path segment.
 * Returns null if no rewriting is needed.
 */
function buildLinkRewriteMap(targetDirectories) {
    const nameMap = {};
    for (const [srcName, config] of Object.entries(targetDirectories)) {
        if (srcName !== config.target) {
            nameMap[srcName] = config.target;
        }
    }
    if (Object.keys(nameMap).length === 0) return null;

    const escaped = Object.keys(nameMap).map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const segmentPattern = new RegExp('(^|/)(' + escaped.join('|') + ')(/|$)', 'g');

    return { nameMap, segmentPattern };
}

/**
 * Rewrites markdown link paths in a single file, replacing source directory
 * names with their target names from the targetDirectories config.
 */
export function rewriteLinksInFile(filePath, targetDirectories) {
    const rewrite = buildLinkRewriteMap(targetDirectories);
    if (!rewrite) return;

    let content = fs.readFileSync(filePath, 'utf8');
    const newContent = content.replace(
        /(\]\()([^)]+)(\))/g,
        (match, open, linkPath, close) => {
            const rewritten = linkPath.replace(rewrite.segmentPattern, (m, before, name, after) => {
                return before + rewrite.nameMap[name] + after;
            });
            return open + rewritten + close;
        }
    );

    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
    }
}

/**
 * Rewrites cross-directory markdown links in all .md files under a directory
 * for targetDirectories repos. Replaces source directory names with target
 * directory names within markdown link syntax.
 */
export function rewriteTargetDirectoryLinks(dir, targetDirectories) {
    const rewrite = buildLinkRewriteMap(targetDirectories);
    if (!rewrite) return;

    const mdFiles = findMdFiles(dir);
    for (const filePath of mdFiles) {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;

        const newContent = content.replace(
            /(\]\()([^)]+)(\))/g,
            (match, open, linkPath, close) => {
                const rewritten = linkPath.replace(rewrite.segmentPattern, (m, before, name, after) => {
                    return before + rewrite.nameMap[name] + after;
                });
                if (rewritten !== linkPath) changed = true;
                return open + rewritten + close;
            }
        );

        if (changed) {
            fs.writeFileSync(filePath, newContent, 'utf8');
        }
    }
}

function findMdFiles(dir) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findMdFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
            results.push(fullPath);
        }
    }
    return results;
}

// ---------------------------------------------------------------------------
// Cross-repository GitHub URL rewriting
// ---------------------------------------------------------------------------

/**
 * Builds a mapping from repo short name (without 'pimcore/' prefix) to its
 * target directory configuration. Used by the GitHub link rewriter.
 *
 * @param {Object} platformVersionConfig - version config entry from platformVersions
 * @returns {Object} repoShortName → { targetDirectory } or { targetDirectories }
 */
export function buildRepoMapping(platformVersionConfig) {
    const mapping = {};
    for (const repoFullName in platformVersionConfig.repos) {
        if (!platformVersionConfig.repos.hasOwnProperty(repoFullName)) continue;
        const repoShortName = repoFullName.replace('pimcore/', '');
        const mergedConfig = getRepositoryConfig(platformVersionConfig, repoFullName);
        if (mergedConfig.targetDirectories) {
            mapping[repoShortName] = { targetDirectories: mergedConfig.targetDirectories };
        } else if (mergedConfig.targetDirectory) {
            mapping[repoShortName] = { targetDirectory: mergedConfig.targetDirectory };
        }
    }
    return mapping;
}

/**
 * Resolves a source doc path (relative to a repo's doc/ folder) to its
 * target path inside the docs/ output directory.
 *
 * @param {string} docPath - path after doc/ in the GitHub URL (e.g. 'README.md' or 'Configuration/Elasticsearch/README.md')
 * @param {string} repoShortName - repo name without pimcore/ prefix
 * @param {Object} repoMapping - output of buildRepoMapping()
 * @returns {string|null} target path relative to docsDir, or null if unmapped
 */
export function resolveDocPath(docPath, repoShortName, repoMapping) {
    const entry = repoMapping[repoShortName];
    if (!entry) return null;

    if (entry.targetDirectory) {
        return entry.targetDirectory + '/' + docPath;
    }

    if (entry.targetDirectories) {
        const firstSlash = docPath.indexOf('/');
        const firstSeg = firstSlash === -1 ? docPath : docPath.slice(0, firstSlash);
        for (const [srcName, config] of Object.entries(entry.targetDirectories)) {
            if (firstSeg === srcName) {
                const rest = docPath.slice(srcName.length); // includes leading /
                return config.target + rest;
            }
        }
    }

    return null;
}

/**
 * Rewrites GitHub URLs in markdown links within a single file.
 * Matches: ](https://github.com/pimcore/<repo>/blob/<branch>/doc(s)/<path>)
 * Replaces with a relative path computed from the file's location in docsDir.
 *
 * @param {string} filePath - absolute or relative path to the .md file
 * @param {string} docsDir - the docs output directory (e.g. './docs')
 * @param {Object} repoMapping - output of buildRepoMapping()
 */
export function rewriteGitHubLinksInFile(filePath, docsDir, repoMapping) {
    let content = fs.readFileSync(filePath, 'utf8');
    const fileDir = path.dirname(filePath);

    const pattern = /(\]\()https:\/\/github\.com\/pimcore\/([^/]+)\/blob\/[^/]+\/docs?\/([^)]*)(\))/g;

    const newContent = content.replace(pattern, (match, open, repoName, rawPath, close) => {
        // Separate anchor from path
        let anchor = '';
        let docPath = rawPath || 'README.md';
        const hashIdx = docPath.indexOf('#');
        if (hashIdx !== -1) {
            anchor = docPath.slice(hashIdx);
            docPath = docPath.slice(0, hashIdx);
        }
        // Default empty path to README.md
        if (!docPath) docPath = 'README.md';

        const resolved = resolveDocPath(docPath, repoName, repoMapping);
        if (!resolved) {
            console.warn('[github-link] Unknown repo or path "' + repoName + '/' + docPath + '" in ' + filePath);
            return match;
        }

        const targetAbsolute = path.resolve(docsDir, resolved);
        let relativePath = path.relative(fileDir, targetAbsolute);
        // Ensure forward slashes on all platforms
        relativePath = relativePath.split(path.sep).join('/');

        return open + relativePath + anchor + close;
    });

    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
    }
}

/**
 * Walks all .md files in docsDir and rewrites GitHub URLs to relative paths.
 *
 * @param {string} docsDir - the docs output directory
 * @param {Object} platformVersionConfig - version config entry
 */
export function rewriteAllGitHubLinks(docsDir, platformVersionConfig) {
    const repoMapping = buildRepoMapping(platformVersionConfig);
    const mdFiles = findMdFiles(docsDir);
    let rewriteCount = 0;

    for (const filePath of mdFiles) {
        const before = fs.readFileSync(filePath, 'utf8');
        rewriteGitHubLinksInFile(filePath, docsDir, repoMapping);
        const after = fs.readFileSync(filePath, 'utf8');
        if (before !== after) rewriteCount++;
    }

    if (rewriteCount > 0) {
        console.log('Rewrote GitHub URLs in ' + rewriteCount + ' file(s)');
    }
}

/**
 * Copies static docs overrides for older doc versions.
 */
export function copyStaticDocs() {
    console.log('Fixing invalid markdown files for older doc versions...');
    fse.copySync('./bin/resources/static_docs/versioned_docs', './versioned_docs', { overwrite: true });
}
