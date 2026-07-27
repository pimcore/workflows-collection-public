/**
 * HeroBanner component for the documentation homepage
 */

import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

interface HeroBannerRowProps {
  children: React.ReactNode;
}

export function HeroBannerRow({ children }: HeroBannerRowProps): JSX.Element {
  return <div className={styles.heroBannerRow}>{children}</div>;
}

interface HeroBannerProps {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string;
}

export function HeroBanner({
  title,
  subtitle,
  buttonText,
  buttonLink,
  imageUrl,
}: HeroBannerProps): JSX.Element {
  return (
    <div
      className={clsx('hero hero--primary', styles.heroBanner)}
      style={{ backgroundImage: `url(${imageUrl})` }}
    >
      <div className="container">
        <Heading as="h1" className={clsx('hero__title', styles.heroTitle)}>
          {title}
        </Heading>
        <p className={clsx('hero__subtitle', styles.heroSubtitle)}>
          {subtitle}
        </p>
        <div className={styles.buttons}>
          <Link
            className={clsx('button button--lg', styles.heroButton)}
            to={buttonLink}
          >
            {buttonText}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HeroBanner;
