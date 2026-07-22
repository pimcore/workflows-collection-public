/**
 * Helper module for resolving repository configuration with platform-level fallbacks.
 * Provides centralized logic for accessing branch, copyReadme, enterprise and other properties.
 * Single entry point for all version configuration access — no consumer should import
 * versionConfiguration.js directly.
 */

import { platformVersions as _platformVersions, baseUrl as _baseUrl } from '../../versionConfiguration.js';

// Re-export raw config for consumers that need it
export const platformVersions = _platformVersions;
export const baseUrl = _baseUrl;

/**
 * Returns the platform version names sorted descending (e.g. ['2025.1', '2024.3', ...])
 * and the next (non-released) version name.
 *
 * @returns {{ versionNames: string[], currentVersion: string, nextVersion: string }}
 */
export function resolveVersions() {
    const versionNames = [];
    let nextVersion = '';

    for (const platformVersion in _platformVersions) {
        if (_platformVersions.hasOwnProperty(platformVersion)) {
            if (_platformVersions[platformVersion].isVersion === false) {
                nextVersion = platformVersion;
            } else {
                versionNames.push(platformVersion);
            }
        }
    }

    versionNames.sort().reverse();
    const currentVersion = versionNames[0];

    return { versionNames, currentVersion, nextVersion };
}

/**
 * Resolves the active platform version name and package name from a URL pathname.
 *
 * @param {string} pathname - The current page pathname
 * @returns {{ version: string, packageName: string }}
 */
export function resolveVersionFromPath(pathname) {
    const { versionNames, currentVersion, nextVersion } = resolveVersions();
    const pathParts = pathname.replace(_baseUrl + '/', '').split('/');

    let version;
    let packageName;

    if (versionNames.includes(pathParts[0])) {
        version = pathParts[0];
        packageName = pathParts[1];
    } else if (pathParts[0] === 'next') {
        version = nextVersion;
        packageName = pathParts[1];
    } else {
        version = currentVersion;
        packageName = pathParts[0];
    }

    return { version, packageName };
}

/**
 * Returns the platform version config for a given version name,
 * resolving 'current' to the latest non-isVersion entry.
 *
 * @param {string} versionName
 * @returns {Object|undefined}
 */
export function getPlatformVersionConfig(versionName) {
    if (versionName === 'current') {
        const keys = Object.keys(_platformVersions);
        return _platformVersions[keys[keys.length - 1]];
    }
    return _platformVersions[versionName];
}

/**
 * Get a repository property with fallback to platform default.
 * Returns undefined if property is not found in either config.
 *
 * @param {Object} repoConfig - Repository-specific configuration
 * @param {Object} platformConfig - Platform version configuration
 * @param {string} propertyName - Name of the property to retrieve
 * @returns {*} Property value with fallback logic applied
 */
export function getRepositoryProperty(repoConfig, platformConfig, propertyName) {
    // Check if repository has the property explicitly set (including false/null)
    if (repoConfig && repoConfig.hasOwnProperty(propertyName)) {
        return repoConfig[propertyName];
    }

    // Map property names to their default counterparts
    const defaultPropertyName = 'default' + propertyName.charAt(0).toUpperCase() + propertyName.slice(1);

    // Fall back to platform-level default if it exists
    if (platformConfig && platformConfig.hasOwnProperty(defaultPropertyName)) {
        return platformConfig[defaultPropertyName];
    }

    // No value found in either config
    return undefined;
}

/**
 * Get complete repository configuration with platform defaults applied.
 * Returns a merged configuration object with all fallbacks resolved.
 *
 * @param {Object} platformVersionConfig - Platform version configuration object
 * @param {string} repositoryName - Name of the repository (e.g., 'pimcore/data-hub')
 * @returns {Object|null} Merged repository configuration or null if not found
 */
export function getRepositoryConfig(platformVersionConfig, repositoryName) {
    if (!platformVersionConfig || !platformVersionConfig.repos) {
        return null;
    }

    const repoConfig = platformVersionConfig.repos[repositoryName];
    if (!repoConfig) {
        return null;
    }

    // Create a merged config with fallbacks applied for known properties
    const mergedConfig = { ...repoConfig };

    // Apply fallbacks for common properties
    const fallbackProperties = ['branch', 'copyReadme', 'enterprise', 'sidebarSection'];

    fallbackProperties.forEach(prop => {
        if (!mergedConfig.hasOwnProperty(prop)) {
            const defaultValue = getRepositoryProperty(repoConfig, platformVersionConfig, prop);
            if (defaultValue !== undefined) {
                mergedConfig[prop] = defaultValue;
            }
        }
    });

    return mergedConfig;
}

/**
 * Get all repositories for a platform version with fallbacks applied.
 *
 * @param {Object} platformVersionConfig - Platform version configuration object
 * @returns {Object} Object with repository names as keys and merged configs as values
 */
export function getAllRepositoryConfigs(platformVersionConfig) {
    if (!platformVersionConfig || !platformVersionConfig.repos) {
        return {};
    }

    const mergedRepos = {};

    for (const repoName in platformVersionConfig.repos) {
        if (platformVersionConfig.repos.hasOwnProperty(repoName)) {
            mergedRepos[repoName] = getRepositoryConfig(platformVersionConfig, repoName);
        }
    }

    return mergedRepos;
}

