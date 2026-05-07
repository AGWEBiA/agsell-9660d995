import { describe, it, expect } from 'vitest';
import {
  resolveGroupId,
  findOrphanGroupNodes,
  flattenWithSubflows,
  isGroupActionSubtype,
  isGroupTriggerSubtype,
} from './groupTargeting';

describe('groupTargeting.resolveGroupId', () => {
  it('prefers explicit config.group_id over triggerContext', () => {
    expect(resolveGroupId({ group_id: 'A' }, { group_id: 'B' })).toBe('A');
  });

  it('falls back to triggerContext.group_id when config has none', () => {
    expect(resolveGroupId({}, { group_id: 'B' })).toBe('B');
  });

  it('falls back to triggerContext.group_id in inline sub-flow mode (config empty)', () => {
    // Sub-node inside a sequence container with no explicit group_id
    expect(resolveGroupId({ message: 'hi' }, { group_id: 'GRP-123' })).toBe('GRP-123');
  });

  it('returns empty string when neither is present', () => {
    expect(resolveGroupId({}, {})).toBe('');
    expect(resolveGroupId(null, null)).toBe('');
  });

  it('ignores non-string group_id values', () => {
    expect(resolveGroupId({ group_id: 123 as unknown as string }, { group_id: 'B' })).toBe('B');
  });
});

describe('groupTargeting.findOrphanGroupNodes', () => {
  it('flags group action nodes with no explicit group_id when trigger is not a group trigger', () => {
    const orphans = findOrphanGroupNodes(
      [
        { id: '1', subtype: 'send_whatsapp_group', config: {} },
        { id: '2', subtype: 'send_whatsapp', config: {} },
      ],
      'lead_created',
    );
    expect(orphans.map(n => n.id)).toEqual(['1']);
  });

  it('does NOT flag when trigger is group_tag_added (inherits group_id)', () => {
    const orphans = findOrphanGroupNodes(
      [{ id: '1', subtype: 'send_whatsapp_group', config: {} }],
      'group_tag_added',
    );
    expect(orphans).toEqual([]);
  });

  it('does NOT flag when explicit group_id is set', () => {
    const orphans = findOrphanGroupNodes(
      [{ id: '1', subtype: 'edit_whatsapp_group', config: { group_id: 'X' } }],
      'lead_created',
    );
    expect(orphans).toEqual([]);
  });
});

describe('groupTargeting.flattenWithSubflows', () => {
  it('extracts sub_nodes from sequence containers (inline mode)', () => {
    const flat = flattenWithSubflows([
      { id: 'seq', subtype: 'sequence_lead', config: {
        sub_nodes: [
          { id: 'sub1', subtype: 'send_whatsapp_group', config: {} },
        ],
      } },
      { id: 'top', subtype: 'send_whatsapp', config: {} },
    ]);
    expect(flat.map(n => n.id).sort()).toEqual(['seq', 'sub1', 'top'].sort());
  });

  it('finds orphans inside container sub-flows (parity with loose nodes)', () => {
    const nodes = [
      { id: 'seq', subtype: 'sequence_lead', config: {
        sub_nodes: [{ id: 'sub1', subtype: 'send_whatsapp_group', config: {} }],
      } },
    ];
    const orphans = findOrphanGroupNodes(flattenWithSubflows(nodes), 'lead_created');
    expect(orphans.map(n => n.id)).toEqual(['sub1']);

    // Same sub-flow under a group trigger should NOT be flagged
    const orphansUnderGroupTrigger = findOrphanGroupNodes(
      flattenWithSubflows(nodes),
      'group_tag_added',
    );
    expect(orphansUnderGroupTrigger).toEqual([]);
  });
});

describe('groupTargeting subtype guards', () => {
  it('isGroupActionSubtype', () => {
    expect(isGroupActionSubtype('send_whatsapp_group')).toBe(true);
    expect(isGroupActionSubtype('edit_whatsapp_group')).toBe(true);
    expect(isGroupActionSubtype('add_to_whatsapp_group')).toBe(true);
    expect(isGroupActionSubtype('send_whatsapp')).toBe(false);
    expect(isGroupActionSubtype(undefined)).toBe(false);
  });
  it('isGroupTriggerSubtype', () => {
    expect(isGroupTriggerSubtype('group_tag_added')).toBe(true);
    expect(isGroupTriggerSubtype('group_tag_removed')).toBe(true);
    expect(isGroupTriggerSubtype('lead_created')).toBe(false);
  });
});
