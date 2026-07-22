import { getRepositoryConfig, resolveVersionFromPath, getPlatformVersionConfig } from '../../bin/modules/versionConfigHelper.mjs';


export function onRouteDidUpdate({location, previousLocation}) {
    const { version, packageName } = resolveVersionFromPath(location.pathname);

    const reposNameRegex = /^(?:\d+\_)?(.*)/;
    let isEnterprise = false;
    const platformVersionConfig = getPlatformVersionConfig(version);
    for (const repositoryName in platformVersionConfig.repos) {
        if (platformVersionConfig.repos.hasOwnProperty(repositoryName)) {

            const repoConfig = getRepositoryConfig(platformVersionConfig, repositoryName);
            if (!repoConfig) continue;

            // Collect all target directory names for this repo
            const targetNames = [];
            if (repoConfig.targetDirectory) {
                targetNames.push(repoConfig.targetDirectory);
            }
            if (repoConfig.targetDirectories) {
                for (const config of Object.values(repoConfig.targetDirectories)) {
                    targetNames.push(config.target);
                }
            }

            const matched = targetNames.some(name => {
                const found = name.match(reposNameRegex);
                return found && found[1] === packageName;
            });

            if (matched) {
                isEnterprise = repoConfig.enterprise;
                break;
            }
        }
    }

    if(isEnterprise) {
        const container = document.querySelector('.container .col');

        if (isEnterprise === 'professional' && !container.classList.contains('enterprise-extension')) {
            container.insertAdjacentHTML('afterbegin', '<div class="ribbon-box"><div class="ribbon"><span>Enterprise & Professional</span></div></div>');
            container.classList.add('enterprise-extension');
            container.classList.add('professional');
        }

        if (isEnterprise === true && !container.classList.contains('enterprise-extension')) {
            container.insertAdjacentHTML('afterbegin', '<div class="ribbon-box"><div class="ribbon"><span>Enterprise</span></div></div>');
            container.classList.add('enterprise-extension');
        }
    }
}
