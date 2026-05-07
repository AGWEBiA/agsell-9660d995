/**
 * Group targeting helpers for Flow Builder & process-automation.
 *
 * These are pure functions so they can be unit-tested and reused both in
 * the editor (validation) and in the runtime (effective group_id resolution).
 *
 * Both the legacy "loose nodes" mode and the new "container sub-flow" mode
 * MUST resolve the target group_id with the same priority:
 *   1. action.config.group_id (explicit)
 *   2. triggerContext.group_id (inherited from group_tag_added/removed)
 */

export const GROUP_ACTION_SUBTYPES = [
  'send_whatsapp_group',
  'edit_whatsapp_group',
  'add_to_whatsapp_group',
] as const;

export const GROUP_TRIGGER_SUBTYPES = [
  'group_tag_added',
  'group_tag_removed',
] as const;

export type GroupActionSubtype = typeof GROUP_ACTION_SUBTYPES[number];

export function isGroupActionSubtype(subtype: string | undefined | null): boolean {
  return !!subtype && (GROUP_ACTION_SUBTYPES as readonly string[]).includes(subtype);
}

export function isGroupTriggerSubtype(subtype: string | undefined | null): boolean {
  return !!subtype && (GROUP_TRIGGER_SUBTYPES as readonly string[]).includes(subtype);
}

/**
 * Resolve the effective group_id for a group action.
 * Returns empty string when none can be determined.
 */
export function resolveGroupId(
  config: Record<string, unknown> | null | undefined,
  triggerContext: Record<string, unknown> | null | undefined,
): string {
  const explicit = config && typeof config.group_id === 'string' ? (config.group_id as string) : '';
  if (explicit) return explicit;
  const inherited = triggerContext && typeof triggerContext.group_id === 'string'
    ? (triggerContext.group_id as string)
    : '';
  return inherited || '';
}

export interface FlowNodeLike {
  id: string;
  type?: string;
  subtype: string;
  label?: string;
  config?: Record<string, unknown>;
}

/**
 * Returns nodes that are group actions but have neither an explicit
 * group_id nor a compatible group trigger to inherit from.
 *
 * Works for both top-level nodes and sub-flow nodes inside sequence
 * containers (caller passes them flattened).
 */
export function findOrphanGroupNodes(
  nodes: FlowNodeLike[],
  triggerSubtype: string | undefined | null,
): FlowNodeLike[] {
  const inheritable = isGroupTriggerSubtype(triggerSubtype);
  return nodes.filter(n => {
    if (!isGroupActionSubtype(n.subtype)) return false;
    const cfg = n.config || {};
    const explicit = typeof cfg.group_id === 'string' && (cfg.group_id as string).length > 0;
    return !explicit && !inheritable;
  });
}

/**
 * Flatten a list of top-level nodes plus any sub_nodes carried inside
 * sequence container configs so the same validation/runtime rules apply
 * uniformly to "loose nodes" and "container sub-flow" structures.
 */
export function flattenWithSubflows(nodes: FlowNodeLike[]): FlowNodeLike[] {
  const out: FlowNodeLike[] = [];
  for (const n of nodes) {
    out.push(n);
    const sub = n.config?.sub_nodes as FlowNodeLike[] | undefined;
    if (Array.isArray(sub)) out.push(...sub);
  }
  return out;
}
