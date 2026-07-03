'use strict';

// A platform-version composer.json conflict bound: "<low || >=high".
// The compatible line is the start of the gap (the value after "<").
const _CONFLICT_RE = /<\s*([0-9][0-9.]*)\s*\|\|\s*>=\s*([0-9][0-9.]*)/;

/**
 * 2026.1 and later use unified branch naming (repo version == platform version).
 * @param {string} line
 * @returns {boolean}
 */
function isUnifiedEra(line) {
  return parseInt(line.split('.')[0], 10) >= 2026;
}

/**
 * Return the compatible version line from a conflict bound like '<2.3 || >=3'.
 * @param {string} constraint
 * @returns {string}
 */
function parseCompatibleLine(constraint) {
  const match = _CONFLICT_RE.exec(constraint || '');
  if (!match) {
    throw new Error(`unrecognised conflict constraint: ${JSON.stringify(constraint)}`);
  }
  return match[1];
}

/**
 * @param {string} line
 * @returns {number[]}
 */
function _versionKey(line) {
  return line.split('.').map(p => parseInt(p, 10));
}

/**
 * Compare two numeric version tuples element-wise (e.g. [2,9] < [11,0]).
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
function _compareVersions(a, b) {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const av = a[i] || 0;
    const bv = b[i] || 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

/**
 * Lowest non-EOL bugfix line by numeric version order.
 * @param {string[]} candidateLines
 * @param {string[]|Set<string>} eolLines
 * @returns {string}
 */
function selectLowestActiveLine(candidateLines, eolLines) {
  const eolSet = eolLines instanceof Set ? eolLines : new Set(eolLines);
  const active = candidateLines.filter(line => !eolSet.has(line));
  if (active.length === 0) {
    throw new Error('no active bugfix lines among candidates');
  }
  return active.reduce((lowest, line) =>
    _compareVersions(_versionKey(line), _versionKey(lowest)) < 0 ? line : lowest
  );
}

/**
 * Derive the conventional ee-* LTS counterpart: 'owner/name' -> 'owner/ee-name'.
 * @param {string} baseRepo
 * @returns {string}
 */
function eeRepoName(baseRepo) {
  if (!baseRepo.includes('/')) {
    throw new Error(`expected 'owner/name', got ${JSON.stringify(baseRepo)}`);
  }
  const slash = baseRepo.indexOf('/');
  const owner = baseRepo.slice(0, slash);
  const name = baseRepo.slice(slash + 1);
  return `${owner}/ee-${name}`;
}

/**
 * Where the target branch lives: base repo first, else the conventional
 * ee-* counterpart. Throws if neither has it.
 * @param {string} baseRepo
 * @param {boolean} branchInBase
 * @param {boolean} branchInEe
 * @returns {string}
 */
function selectBranchRepo(baseRepo, branchInBase, branchInEe) {
  if (branchInBase) return baseRepo;
  if (branchInEe) return eeRepoName(baseRepo);
  throw new Error(
    `branch not found in base repo ${JSON.stringify(baseRepo)} or its ee-* counterpart`
  );
}

module.exports = {
  isUnifiedEra,
  parseCompatibleLine,
  selectLowestActiveLine,
  eeRepoName,
  selectBranchRepo,
};
