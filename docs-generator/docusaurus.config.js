// @ts-check
// Minimal, self-contained Docusaurus config for per-repo documentation
// test builds (render + broken-link check). Deliberately carries NO
// private repo topology: it does not require ./versionConfiguration.js,
// so it is safe to live in a public repository.
import { themes } from "prism-react-renderer";

const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Pimcore Development Documentation',
  tagline: 'Own the digital world',
  url: 'https://pimcore.com/',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',
  favicon: 'img/favicon.png',

  organizationName: 'pimcore',
  projectName: 'pimcore',

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
          // No editUrl: the source-repo map lives in the private
          // versionConfiguration.js and is not needed to validate docs.
        },
        blog: false,
        theme: {
          customCss: [
            require.resolve('./src/css/custom.css'),
          ],
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
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
        ],
      },
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },
      footer: {
        style: 'dark',
        copyright: `Copyright © ${new Date().getFullYear()} Pimcore GmbH, build with Docusaurus`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['php', 'twig', 'markup-templating'],
      },
    }),

  plugins: [
    [
      require.resolve('@docusaurus/plugin-ideal-image'),
      {},
    ],
  ],
};

module.exports = config;
