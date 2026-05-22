import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tempDir = await mkdtemp(path.join(tmpdir(), 'herenciard-sienna-tests-'));
const entryPath = path.join(tempDir, 'entry.ts');
const bundlePath = path.join(tempDir, 'bundle.mjs');

const aliasPlugin = {
  name: 'herenciard-alias',
  setup(build) {
    build.onResolve({ filter: /^@\// }, (args) => {
      const resolved = path.join(root, 'src', args.path.slice(2));
      return { path: path.extname(resolved) ? resolved : resolved + '.ts' };
    });
  },
};

await writeFile(
  entryPath,
  [
    'export { applySiennaCaseConfig, buildDominicanInheritancePlan } from ' + JSON.stringify(path.join(root, 'src/lib/dominicanInheritance.ts')) + ';',
    'export { calculateHeirAmount, resolveEstateAmounts } from ' + JSON.stringify(path.join(root, 'src/lib/siennaCalculation.ts')) + ';',
  ].join('\n')
);

await esbuild.build({
  entryPoints: [entryPath],
  outfile: bundlePath,
  bundle: true,
  format: 'esm',
  platform: 'node',
  plugins: [aliasPlugin],
  logLevel: 'silent',
});

const {
  applySiennaCaseConfig,
  buildDominicanInheritancePlan,
  calculateHeirAmount,
  resolveEstateAmounts,
} = await import(pathToFileURL(bundlePath));

const member = (id, name, extra = {}) => ({
  id,
  name,
  parent_id: null,
  relationship_to_parent: null,
  birth: null,
  death: null,
  spouse_member_id: null,
  spouse: null,
  spouse_birth: null,
  inheritance_status: 'requiere_revision',
  inheritance_reason: null,
  is_highlighted_ancestor: false,
  sort_order: 0,
  ...extra,
});

const shareByName = (plan, name) => plan.activeHeirs.find((share) => share.member.name === name)?.share ?? 0;

try {
  applySiennaCaseConfig({
    causante_name: 'Causante directo',
    active_collateral_roots: [{ name: 'Rama externa', label: 'Rama externa' }],
  });
  const directPlan = buildDominicanInheritancePlan([
    member('c', 'Causante directo'),
    member('h1', 'Hija viva', { parent_id: 'c', relationship_to_parent: 'hija' }),
    member('h2', 'Hijo vivo', { parent_id: 'c', relationship_to_parent: 'hijo' }),
  ]);
  assert.equal(directPlan.activeHeirs.length, 2);
  assert.equal(shareByName(directPlan, 'Hija viva'), 50);
  assert.equal(shareByName(directPlan, 'Hijo vivo'), 50);

  applySiennaCaseConfig({ causante_name: 'Causante representacion' });
  const representationPlan = buildDominicanInheritancePlan([
    member('c', 'Causante representacion'),
    member('h1', 'Hija viva', { parent_id: 'c', relationship_to_parent: 'hija' }),
    member('h2', 'Hijo fallecido', { parent_id: 'c', relationship_to_parent: 'hijo', death: '2020' }),
    member('n1', 'Nieta viva', { parent_id: 'h2', relationship_to_parent: 'hija' }),
    member('n2', 'Nieto vivo', { parent_id: 'h2', relationship_to_parent: 'hijo' }),
  ]);
  assert.equal(representationPlan.activeHeirs.length, 3);
  assert.equal(shareByName(representationPlan, 'Hija viva'), 50);
  assert.equal(shareByName(representationPlan, 'Nieta viva'), 25);
  assert.equal(shareByName(representationPlan, 'Nieto vivo'), 25);

  applySiennaCaseConfig({ causante_name: 'Causante redistribucion' });
  const redistributionPlan = buildDominicanInheritancePlan([
    member('c', 'Causante redistribucion'),
    member('h1', 'Hija viva', { parent_id: 'c', relationship_to_parent: 'hija' }),
    member('h2', 'Hijo fallecido sin descendencia', { parent_id: 'c', relationship_to_parent: 'hijo', death: '2020' }),
    member('h3', 'Hijo fallecido representado', { parent_id: 'c', relationship_to_parent: 'hijo', death: '2021' }),
    member('n1', 'Nieta representada', { parent_id: 'h3', relationship_to_parent: 'hija' }),
  ]);
  assert.equal(redistributionPlan.activeHeirs.length, 2);
  assert.equal(shareByName(redistributionPlan, 'Hija viva'), 50);
  assert.equal(shareByName(redistributionPlan, 'Nieta representada'), 50);
  assert.equal(shareByName(redistributionPlan, 'Hijo fallecido sin descendencia'), 0);

  applySiennaCaseConfig({
    causante_name: 'Causante sin descendencia registrada',
    active_collateral_roots: [
      { name: 'Raiz A', label: 'Rama A' },
      { name: 'Raiz B', label: 'Rama B' },
    ],
  });
  const doubleLinePlan = buildDominicanInheritancePlan(
    [
      member('ra', 'Raiz A', { death: '1930' }),
      member('rb', 'Raiz B', { death: '1935' }),
      member('x', 'Heredero doble'),
    ],
    {
      unions: [],
      parent_links: [
        { id: 'la', child_member_id: 'x', parent_member_id: 'ra', parent_role: 'progenitor', union_id: null, link_type: 'biologico', is_primary_line: true, confidence: 'alta', is_inconsistent: false },
        { id: 'lb', child_member_id: 'x', parent_member_id: 'rb', parent_role: 'progenitor', union_id: null, link_type: 'biologico', is_primary_line: false, confidence: 'alta', is_inconsistent: false },
      ],
    }
  );
  assert.equal(doubleLinePlan.activeHeirs.length, 1);
  assert.equal(shareByName(doubleLinePlan, 'Heredero doble'), 100);
  assert.deepEqual(doubleLinePlan.activeHeirs[0].sources, ['Rama A', 'Rama B']);

  applySiennaCaseConfig({
    causante_name: 'Causante sin descendencia registrada',
    active_collateral_roots: [
      { name: 'Maria Rosa', label: 'Rama Maria Rosa' },
      { name: 'Pedro Pablo', label: 'Rama Pedro Pablo' },
    ],
  });
  const separatedLinePlan = buildDominicanInheritancePlan(
    [
      member('maria', 'Maria Rosa', { death: '1981', spouse_member_id: 'pedro' }),
      member('pedro', 'Pedro Pablo', { death: '1986', spouse_member_id: 'maria' }),
      member('hijo-comun', 'Hijo comun Maria Pedro'),
      member('pablito', 'Pablito Sangiovanni', { parent_id: 'pedro', relationship_to_parent: 'hijo' }),
    ],
    {
      unions: [
        { id: 'union-maria-pedro', partner_a_member_id: 'maria', partner_b_member_id: 'pedro', union_type: 'matrimonio', confidence: 'alta', is_inconsistent: false },
      ],
      parent_links: [
        { id: 'lm1', child_member_id: 'hijo-comun', parent_member_id: 'maria', parent_role: 'madre', union_id: 'union-maria-pedro', link_type: 'biologico', is_primary_line: true, confidence: 'alta', is_inconsistent: false },
        { id: 'lp1', child_member_id: 'hijo-comun', parent_member_id: 'pedro', parent_role: 'padre', union_id: 'union-maria-pedro', link_type: 'biologico', is_primary_line: true, confidence: 'alta', is_inconsistent: false },
        { id: 'lp2', child_member_id: 'pablito', parent_member_id: 'pedro', parent_role: 'padre', union_id: null, link_type: 'biologico', is_primary_line: true, confidence: 'alta', is_inconsistent: false },
      ],
    }
  );
  assert.equal(separatedLinePlan.activeHeirs.length, 2);
  assert.equal(shareByName(separatedLinePlan, 'Hijo comun Maria Pedro'), 75);
  assert.equal(shareByName(separatedLinePlan, 'Pablito Sangiovanni'), 25);
  assert.deepEqual(
    separatedLinePlan.activeHeirs.find((share) => share.member.name === 'Pablito Sangiovanni')?.sources,
    ['Rama Pedro Pablo']
  );

  const amounts = resolveEstateAmounts(1000000, 15);
  assert.deepEqual(amounts, {
    grossAmount: 1000000,
    lawyerFeePercentage: 15,
    lawyerFeeAmount: 150000,
    distributableAmount: 850000,
  });
  assert.equal(calculateHeirAmount(25, amounts.distributableAmount), 212500);

  console.log('Sienna inheritance checks passed');
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
