<?php
declare(strict_types=1);

/**
 * This source file is available under the terms of the
 * Pimcore Open Core License (POCL)
 * Full copyright and license information is available in
 * LICENSE.md which is distributed with this source code.
 *
 *  @copyright  Copyright (c) Pimcore GmbH (https://www.pimcore.com)
 *  @license    Pimcore Open Core License (POCL)
 */

/**
 * Standalone Studio OpenAPI export — runs against a plain checkout of
 * studio-backend-bundle (or any bundle with Studio OpenAPI attributes) with
 * nothing but its composer vendor directory: no Pimcore kernel, no database,
 * no bundle activity. Deliberately self-contained so it works on every
 * release line, including ones that predate OpenApiService::exportConfig
 * (pimcore/studio-backend-bundle#2278). It mirrors that pipeline:
 * generate → sort schemas by title → sort tags deterministically → replace
 * {prefix} → translate from the yaml catalogs → restrict to scopes with a
 * transitive $ref closure.
 *
 * Usage (from the checked-out bundle):
 *   php export-openapi.php --autoload=vendor/autoload.php \
 *     --scan-path=src --translations=translations \
 *     [--locale=en] [--route-prefix=/pimcore-studio/api] \
 *     [--scope=/pimcore-studio/api/bundle/data-hub]... \
 *     [--pretty] [--output=backend-core.json]
 *
 * The JSON goes to --output or stdout; diagnostics go to stderr.
 */

error_reporting(E_ALL);
ini_set('display_errors', 'stderr');

$options = getopt('', [
    'autoload:',
    'scan-path:',
    'translations:',
    'locale:',
    'route-prefix:',
    'scope:',
    'output:',
    'pretty',
]);

$fail = static function (string $message): never {
    fwrite(STDERR, $message . "\n");
    exit(2);
};

$toList = static fn ($value): array => $value === null ? [] : (array) $value;

$autoload = $options['autoload'] ?? 'vendor/autoload.php';
if (!is_file($autoload)) {
    $fail(sprintf('Autoload file not found: %s', $autoload));
}
require $autoload;

$scanPaths = $toList($options['scan-path'] ?? null);
if ($scanPaths === []) {
    $fail('At least one --scan-path is required.');
}
foreach ($scanPaths as $path) {
    if (!is_dir($path)) {
        $fail(sprintf('Scan path is not a directory: %s', $path));
    }
}

$locale = $options['locale'] ?? null;
$routePrefix = $options['route-prefix'] ?? '/pimcore-studio/api';
$scopes = $toList($options['scope'] ?? null);

// --- translations -----------------------------------------------------------

$catalog = [];
foreach ($toList($options['translations'] ?? null) as $dir) {
    if (!is_dir($dir)) {
        $fail(sprintf('Translations path is not a directory: %s', $dir));
    }
    $file = sprintf('%s/studio_api_docs.%s.yaml', rtrim($dir, '/'), $locale ?? 'en');
    if (is_file($file)) {
        $catalog = array_merge($catalog, \Symfony\Component\Yaml\Yaml::parseFile($file) ?? []);
    }
}

// --- generate (mirrors OpenApiService::buildConfig, without the bundle filter) ---

$config = (new \OpenApi\Generator())->generate($scanPaths);
if ($config === null) {
    $fail('swagger-php returned no spec.');
}

$compareTagNames = static function (string $a, string $b): int {
    $aIsBundle = str_starts_with($a, 'Bundle');
    $bIsBundle = str_starts_with($b, 'Bundle');
    if ($aIsBundle !== $bIsBundle) {
        return $aIsBundle ? 1 : -1;
    }

    return $a <=> $b;
};

if (is_array($config->components->schemas ?? null)) {
    usort($config->components->schemas, static fn ($a, $b) => $a->title <=> $b->title);
}
if (is_array($config->tags ?? null)) {
    usort($config->tags, static fn ($a, $b) => $compareTagNames((string) $a->name, (string) $b->name));
}
if (is_array($config->paths ?? null)) {
    foreach ($config->paths as $pathItem) {
        $pathItem->path = str_replace('{prefix}', $routePrefix, $pathItem->path);
    }
}

$spec = json_decode(json_encode($config, JSON_THROW_ON_ERROR), true, 512, JSON_THROW_ON_ERROR);

// --- translate summary/description (mirrors OpenApiService::translateRecursive) ---

if ($locale !== null) {
    $translate = static function (array &$node) use (&$translate, $catalog): void {
        foreach ($node as $key => &$value) {
            if (is_string($value) && in_array($key, ['summary', 'description'], true)) {
                $translated = $catalog[$value] ?? $value;
                $value = is_string($translated) ? $translated : $value;
            } elseif (is_array($value)) {
                $translate($value);
            }
        }
    };
    $translate($spec);
}

// --- restrict to scopes (mirrors OpenApiSpecProcessor::restrictToScopes) ----

if ($scopes !== []) {
    $spec['paths'] = array_filter(
        $spec['paths'] ?? [],
        static function (string $path) use ($scopes): bool {
            foreach ($scopes as $scope) {
                $scope = rtrim((string) $scope, '/');
                if ($path === $scope || str_starts_with($path, $scope . '/')) {
                    return true;
                }
            }

            return false;
        },
        ARRAY_FILTER_USE_KEY
    );

    if (is_array($spec['components'] ?? null)) {
        $components = $spec['components'];
        $keep = [];
        $stack = [$spec['paths']];
        while ($stack !== []) {
            $current = array_pop($stack);
            if (!is_array($current)) {
                continue;
            }
            foreach ($current as $key => $value) {
                if (
                    $key === '$ref'
                    && is_string($value)
                    && preg_match('~^#/components/([^/]+)/(.+)$~', $value, $matches) === 1
                ) {
                    [, $bucket, $name] = $matches;
                    if (!isset($keep[$bucket][$name]) && isset($components[$bucket][$name])) {
                        $keep[$bucket][$name] = true;
                        $stack[] = $components[$bucket][$name];
                    }
                } elseif (is_array($value)) {
                    $stack[] = $value;
                }
            }
        }
        $filtered = [];
        foreach ($components as $bucket => $entries) {
            if ($bucket === 'securitySchemes') {
                $filtered[$bucket] = $entries;

                continue;
            }
            $kept = array_filter(
                $entries,
                static fn (string $name): bool => isset($keep[$bucket][$name]),
                ARRAY_FILTER_USE_KEY
            );
            if ($kept !== []) {
                $filtered[$bucket] = $kept;
            }
        }
        $spec['components'] = $filtered;
    }

    if (is_array($spec['tags'] ?? null)) {
        $usedTags = [];
        foreach ($spec['paths'] as $pathItem) {
            foreach ((array) $pathItem as $operation) {
                foreach ((array) ($operation['tags'] ?? []) as $tag) {
                    if (is_string($tag)) {
                        $usedTags[$tag] = true;
                    }
                }
            }
        }
        $spec['tags'] = array_values(array_filter(
            $spec['tags'],
            static fn (array $tag): bool => isset($usedTags[$tag['name'] ?? ''])
        ));
    }
}

// --- output ------------------------------------------------------------------

$flags = JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE;
if (isset($options['pretty'])) {
    $flags |= JSON_PRETTY_PRINT;
}
$json = json_encode($spec, $flags) . "\n";

fwrite(STDERR, sprintf(
    "export-openapi: paths=%d schemas=%d tags=%d swagger-php=%s\n",
    count($spec['paths'] ?? []),
    count($spec['components']['schemas'] ?? []),
    count($spec['tags'] ?? []),
    \Composer\InstalledVersions::getVersion('zircote/swagger-php') ?? 'unknown'
));

if (isset($options['output']) && $options['output'] !== '-') {
    if (@file_put_contents($options['output'], $json) === false) {
        $fail(sprintf('Could not write to %s', $options['output']));
    }
} else {
    fwrite(STDOUT, $json);
}
