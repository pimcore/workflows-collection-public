/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable global-require */

import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Image from '@theme/IdealImage';
import Heading from '@theme/Heading';

interface CardProps {
    name: string;
    image: string;
    url: string;
    description: JSX.Element;
    linkText: string;
}

function PlaygroundCard({name, image, url, description, linkText}: CardProps) {
    return (
        <div className="col col--6 margin-bottom--lg">
            <div className={clsx('card')}>
                <div className={clsx('card__image')}>
                    <Link to={url}>
                        <Image img={image} alt={`${name}'s image`} />
                    </Link>
                </div>
                <div className="card__body">
                    <Heading as="h3">{name}</Heading>
                    <p>{description}</p>
                </div>
                <div className="card__footer">
                    <div className="button-group button-group--block">
                        <Link className="button button--primary" to={url}>
                            {linkText}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}


interface RowProps {
    teasers: Array<any>
}


export function IndexCardsRow({teasers}: RowProps): JSX.Element {
    return (
        <div className="row">
            {teasers.map((teaser) => (
                <PlaygroundCard key={teaser.name} {...teaser} />
            ))}
        </div>
    );
}