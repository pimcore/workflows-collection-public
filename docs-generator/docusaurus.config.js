// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion
import {themes} from "prism-react-renderer";
import { baseUrl, platformVersions, getRepositoryConfig, getPlatformVersionConfig } from './bin/modules/versionConfigHelper.mjs';

const {sidebarModificator} = require('./sidebar-modificator.js');

const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;


/** @type {import('@docusaurus/types').Config} */
const config = {
    title: 'Pimcore Development Documentation',
    tagline: 'Own the digital world',
    url: 'https://docs.pimcore.com/',
    baseUrl: baseUrl,
    onBrokenLinks: 'warn',
    onBrokenMarkdownLinks: 'warn',
    favicon: 'img/favicon.png',

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'pimcore', // Usually your GitHub org/user name.
    projectName: 'pimcore', // Usually your repo name.

    // Even if you don't use internalization, you can use this field to set useful
    // metadata like html lang. For example, if your site is Chinese, you may want
    // to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },

    presets: [
        [
            'classic',
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    routeBasePath: '/',
                    sidebarPath: require.resolve('./sidebars.js'),
                    // showLastUpdateAuthor: true,
                    // showLastUpdateTime: true,
                    editUrl: ({version, docPath}) => {
                        if (version === 'current') {
                            for (const versionName of Object.keys(platformVersions)) {
                                if (!platformVersions[versionName].isVersion) {
                                    version = versionName;
                                    break;
                                }
                            }
                        }

                        let splitDocPath = docPath.split('/');
                        const repoTargetDir = splitDocPath.shift();

                        const platformVersionConfig = getPlatformVersionConfig(version);
                        const repos = platformVersionConfig.repos;
                        let newDocPath = '';
                        for (const repoName of Object.keys(repos)) {
                            if (repos[repoName].targetDirectory === repoTargetDir) {

                                const repoConfig = getRepositoryConfig(platformVersionConfig, repoName);

                                if (repoConfig.enterprise === true) {
                                    return;
                                }

                                newDocPath = splitDocPath.join('/');

                                const branch = repoConfig.readmeEditBranch || repoConfig.branch;

                                if (splitDocPath.length === 1 && newDocPath === 'README.md') {
                                    return `https://github.com/${repoName}/edit/${branch}/${newDocPath}`;
                                }
                                return `https://github.com/${repoName}/edit/${branch}/doc/${newDocPath}`;
                            }

                            if (repos[repoName].targetDirectories) {
                                for (const [srcName, config] of Object.entries(repos[repoName].targetDirectories)) {
                                    if (config.target === repoTargetDir) {
                                        const repoConfig = getRepositoryConfig(platformVersionConfig, repoName);
                                        if (repoConfig.enterprise === true) return;
                                        const branch = repoConfig.readmeEditBranch || repoConfig.branch;
                                        const editPath = srcName + (splitDocPath.length ? '/' + splitDocPath.join('/') : '');
                                        return `https://github.com/${repoName}/edit/${branch}/doc/${editPath}`;
                                    }
                                }
                            }
                        }
                    },
                    async sidebarItemsGenerator({defaultSidebarItemsGenerator, ...args}) {
                        const sidebarItems = await defaultSidebarItemsGenerator(args);
                        return sidebarModificator(sidebarItems, args);
                    },
                },
                blog: false,
                theme: {
                    customCss: [
                        require.resolve('./src/css/custom.css'),
                    ],
                },
                googleTagManager: {
                    containerId: 'GTM-MRTR3TR',
                },
            }),
        ],
    ],

    themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            navbar: {
                //title: 'Pimcore Documentation',
                logo: {
                    alt: 'Pimcore Logo',
                    src: 'img/logo.svg',
                    srcDark: 'img/logo-white.svg',
                },
                items: [
                    {
                        type: 'docsVersion',
                        position: 'left',
                        label: 'Pimcore Documentation',
                    },
                    {
                        href: '/platform/Paas',
                        label: 'Pimcore PaaS',
                    },
                    {
                        href: 'https://pimcore.com/en/resources/learning-hub',
                        label: 'Academy',
                    },
                    // {
                    //   href: 'https://pimcore.com/academy',
                    //   label: 'User Group',
                    // },
                    {
                        href: 'https://github.com/pimcore/pimcore/discussions',
                        label: 'Forums',
                    },
                    {
                        href: 'https://pimcore.com/en/contact-us',
                        label: 'Contact Us',
                    },
                    {
                        type: 'docsVersionDropdown',
                        position: 'right',
                        //dropdownItemsAfter: [{to: '/versions', label: 'All versions'}],
                        dropdownActiveClassDisabled: true,
                    }
                ]
            },
            docs: {
                sidebar: {
                    hideable: true,
                    autoCollapseCategories: true,
                },
            },
            //docs: false,
            footer: {
                style: 'dark',
                links: [
                    {
                        title: 'Learning Center',
                        items: [
                            {
                                label: 'Pimcore Academy',
                                href: 'https://pimcore.com/en/resources/learning-hub',
                            },
                            {
                                label: 'Pimcore 10 Documentation',
                                href: 'https://docs.pimcore.com/pimcore/10.6',
                            },
                            {
                                label: 'Pimcore Demo',
                                href: 'https://demo.pimcore.com',
                            },
                        ],
                    },
                    {
                        title: 'Community',
                        items: [
                            {
                                label: 'GitHub',
                                href: 'https://github.com/pimcore',
                            },
                            {
                                label: 'Forums',
                                href: 'https://github.com/pimcore/pimcore/discussions',
                            }
                        ],
                    },
                    {
                        title: 'Download',
                        items: [
                            {
                                label: 'Pimcore Download Page',
                                href: 'https://pimcore.com/en/platform/community-edition',
                            },
                            {
                                label: 'Download Pimcore Demo',
                                href: 'https://github.com/pimcore/demo',
                            },
                            {
                                label: 'Download Pimcore Skeleton',
                                href: 'https://github.com/pimcore/skeleton',
                            },
                        ],
                    },
                ],
                copyright: `Copyright © ${new Date().getFullYear()} Pimcore GmbH, build with Docusaurus`
            },
            prism: {
                theme: lightCodeTheme,
                darkTheme: darkCodeTheme,
                additionalLanguages: ['php', 'twig', 'markup-templating']
            },
            algolia: {
                // The application ID provided by Algolia
                appId: 'MICNWB0JJI',

                // Public API key: it is safe to commit it
                apiKey: 'bf6a5b8264efa836166865878e91769a',

                indexName: 'pimcore',
                contextualSearch: true,
            },
        }),

    plugins: [
        [
            require.resolve('@docusaurus/plugin-ideal-image'),
            {}
        ],[
            require.resolve('@signalwire/docusaurus-plugin-llms-txt'),
            {
                siteTitle: 'Pimcore Platform Documentation',
                depth: 4,
                content: {
                    includeBlog: false,
                    includePages: false,
                    includeVersionedDocs: false,
                    enableLlmsFullTxt: true,
                }
            }
        ]
    ],
    clientModules: [
        './src/clientModules/enterpriseBadge.js'
    ],
    markdown: {
        mermaid: true,
    },
    themes: ['@docusaurus/theme-mermaid'],
    future: {
        experimental_faster: true,
        v4: true
    }
};

module.exports = config;
