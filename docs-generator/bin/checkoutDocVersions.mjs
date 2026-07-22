import {
    checkoutBranch as gitCheckoutBranch,
    cloneRepository as gitCloneRepository
} from './modules/git.mjs';
import { platformVersions } from './modules/versionConfigHelper.mjs';
import * as fs from 'fs';
import { prepareVersionDocs, finalizeVersionsJson, copyStaticDocs } from './modules/docs.mjs';

export function main() {

    let versionArray = [];
    for (const platformVersion in platformVersions) {

        if(platformVersions.hasOwnProperty(platformVersion)) {

            const platformVersionConfig = platformVersions[platformVersion];

            versionArray = prepareVersionDocs(platformVersionConfig, platformVersion, versionArray, {
                beforeCopyHook(repoPath, repository, repositoryConfig) {
                    if (!fs.existsSync(repoPath)) {
                        gitCloneRepository('./repos', repository);
                    }
                    gitCheckoutBranch(repoPath, repositoryConfig.branch);
                }
            });

        }
    }

    copyStaticDocs();
    finalizeVersionsJson(versionArray);
}

main();
