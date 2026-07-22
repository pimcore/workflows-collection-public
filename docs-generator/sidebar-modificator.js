const { getPlatformVersionConfig } = require('./bin/modules/versionConfigHelper.mjs');



function findSourceDir(id, sidebarDocs) {
    for(const sidebarDoc of sidebarDocs) {
        if(sidebarDoc.id === id) {
            return sidebarDoc.sourceDirName;
        }
    }

    return null;
}

function applyDefaults(repoConfig, versionConfiguration) {
    const result = { ...repoConfig };
    if (!result.hasOwnProperty('sidebarSection') && versionConfiguration.defaultSidebarSection !== undefined) {
        result.sidebarSection = versionConfiguration.defaultSidebarSection;
    }
    return result;
}

function getVersionConfig(targetDirectory, versionConfiguration) {
    for (const versionConfig in versionConfiguration.repos) {
        const repoConfig = versionConfiguration.repos[versionConfig];
        if(repoConfig.targetDirectory === targetDirectory) {
            return applyDefaults(repoConfig, versionConfiguration);
        }
        if (repoConfig.targetDirectories) {
            for (const config of Object.values(repoConfig.targetDirectories)) {
                if (config.target === targetDirectory) {
                    const merged = config.sidebarGroup !== undefined
                        ? { ...repoConfig, sidebarGroup: config.sidebarGroup }
                        : repoConfig;
                    return applyDefaults(merged, versionConfiguration);
                }
            }
        }
    }

    return null;
}

function extractSidebarGroup(id, sidebarDocs, versionConfiguration) {
    const sourceDir = findSourceDir(id, sidebarDocs);
    if(sourceDir === null) return null;

    const versionConfig = getVersionConfig(sourceDir, versionConfiguration);
    if(versionConfig === null) return null;

    return versionConfig.sidebarGroup;
}

function extractSidebarSection(id, sidebarDocs, versionConfiguration) {
    const sourceDir = findSourceDir(id, sidebarDocs);
    if(sourceDir === null) return null;

    const versionConfig = getVersionConfig(sourceDir, versionConfiguration);
    if(versionConfig === null) return null;

    return versionConfig.sidebarSection || null;
}

function makeSectionHeader(label) {
    return {
        type: 'html',
        value: '<span class="sidebar-section-header">' + label + '</span>',
        className: 'sidebar-section-divider',
    };
}

const sidebarModificator = function(items, args) {
    const transformedItems = [];
    const sidebarGroups = {};
    let currentSection = null;

    const versionConfiguration = getPlatformVersionConfig(args.version.versionName);

    if(versionConfiguration) {
        for(const item of items) {
            if (item.link === undefined) {
                transformedItems.push(item);
            } else {
                const sidebarGroup = extractSidebarGroup(item.link.id, args.docs, versionConfiguration);
                const sidebarSection = extractSidebarSection(item.link.id, args.docs, versionConfiguration);

                if (sidebarSection && sidebarSection !== currentSection) {
                    currentSection = sidebarSection;
                    transformedItems.push(makeSectionHeader(sidebarSection));
                }

                if(sidebarGroup) {
                    if(!sidebarGroups[sidebarGroup]) {
                        sidebarGroups[sidebarGroup] = {
                            type: "category",
                            label: sidebarGroup,
                            items: []
                        };
                        transformedItems.push(sidebarGroups[sidebarGroup]);
                    }

                    sidebarGroups[sidebarGroup].items.push(item);
                } else {
                    transformedItems.push(item);
                }
            }
        }
    }

    return transformedItems;
}

module.exports = { sidebarModificator };
