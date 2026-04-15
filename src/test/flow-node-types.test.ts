import { describe, expect, it } from 'vitest';
import {
  nodeCategories,
  triggerOptions,
  conditionOptions,
  actionOptions,
} from '@/components/flow-builder/flowNodeTypes';

describe('Flow Node Types', () => {
  it('has all core node types defined', () => {
    const allNodes = nodeCategories.flatMap(c => c.nodes);
    const ids = allNodes.map(n => n.id);
    expect(ids).toContain('send_whatsapp');
    expect(ids).toContain('send_email_performance');
    expect(ids).toContain('timer');
    expect(ids).toContain('conditional');
    expect(ids).toContain('add_tag');
  });

  it('each node has id, label, icon', () => {
    const allNodes = nodeCategories.flatMap(c => c.nodes);
    for (const node of allNodes) {
      expect(node.id).toBeTruthy();
      expect(node.label).toBeTruthy();
      expect(node.icon).toBeTruthy();
    }
  });

  it('nodeCategories cover all expected groups', () => {
    const labels = nodeCategories.map(c => c.label);
    expect(labels).toContain('Disparos');
    expect(labels).toContain('Instagram');
    expect(labels).toContain('Ações');
    expect(labels).toContain('Condições');
    expect(labels).toContain('Sequências');
    expect(labels).toContain('Integrar');
    expect(labels).toContain('Extras');
    expect(labels).toContain('Controladores');
  });

  it('triggerOptions has whatsapp and instagram triggers', () => {
    const ids = triggerOptions.map(t => t.id);
    expect(ids).toContain('whatsapp_received');
    expect(ids).toContain('instagram_dm');
  });

  it('conditionOptions are defined', () => {
    expect(conditionOptions.length).toBeGreaterThan(0);
    for (const opt of conditionOptions) {
      expect(opt.id).toBeTruthy();
      expect(opt.label).toBeTruthy();
    }
  });

  it('voice_torpedo node exists', () => {
    const allNodes = nodeCategories.flatMap(c => c.nodes);
    expect(allNodes.find(n => n.id === 'voice_torpedo')).toBeTruthy();
  });

  it('parallel_channels (fishbone) node exists', () => {
    const allNodes = nodeCategories.flatMap(c => c.nodes);
    expect(allNodes.find(n => n.id === 'parallel_channels')).toBeTruthy();
  });

  it('link_split node exists', () => {
    const allNodes = nodeCategories.flatMap(c => c.nodes);
    expect(allNodes.find(n => n.id === 'link_split')).toBeTruthy();
  });

  it('note node exists', () => {
    const allNodes = nodeCategories.flatMap(c => c.nodes);
    expect(allNodes.find(n => n.id === 'note')).toBeTruthy();
  });
});
