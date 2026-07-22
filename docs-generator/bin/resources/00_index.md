---
id: root
slug: /
title: Introduction
hide_table_of_contents: true
---


# Pimcore Development Documentation

Welcome to the Pimcore Development documentation. The Pimcore platform consists of the **Pimcore Core Framework**
combined with optional additional **Core Extensions** based on your needs. The development documentation structure also
follows that schema and provides:

- [Core Framework Documentation](/Pimcore): Find all the documentation for the core framework itself.
- [Pimcore Platform](/Pimcore_Platform): Architecture, modules, platform versions, and editions.
- Core Extensions documentations: Find documentation for all the core extensions in the sidebar.


## Additional resources to check out

We offer various resources and tools to help you get the most out of our platform. Gain deeper insights into
Pimcore and take your skills to the next level.


```mdx-code-block
import {IndexCardsRow} from '@site/src/components/IndexCards';

export const teasers = [
    {
        name: 'Pimcore Academy',
        image: require('@site/static/img/pimcore-academy.png'),
        url: 'https://pimcore.com/en/resources/learning-hub',
        linkText: 'Try it now!',
        description: 'Achieve certification tailored to your professional role, experience and software edition.',
    },
    {
        name: 'Try Experience Portal',
        image: require('@site/static/img/pimcore-experience-portal.png'),
        url: 'https://pimcore.com/en/demo-request',
        linkText: 'Open the Demo',
        description: 'Experiment with different use cases, try out features, and refine your workflows.',
    },
];

<IndexCardsRow  teasers={teasers}/>
```
