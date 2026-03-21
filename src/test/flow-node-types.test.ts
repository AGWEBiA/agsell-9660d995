import { describe, it, expect } from 'vitest';
import { actionOptions, nodeCategories } from '@/components/flow-builder/flowNodeTypes';

describe('Flow Node Types', () => {
  it('has all core node types defined', () => {
    const typeIds = actionOptions.map(n => n.type);
    expect(typeIds).toContain('whatsapp');
    expect(typeIds).toContain('email');
    expect(typeIds).toContain('sms');
    expect(typeIds).toContain('timer');
    expect(typeIds).toContain('condition');
    expect(typeIds).toContain('tag');
    expect(typeIds).toContain('voice_torpedo');
    expect(typeIds).toContain('parallel');
    expect(typeIds).toContain('note');
    expect(typeIds).toContain('link_split');
    expect(typeIds).toContain('whatsapp_group_edit');
  });

  it('each node has required properties', () => {
    for (const node of actionOptions) {
      expect(node).toHaveProperty('type');
      expect(node).toHaveProperty('label');
      expect(node).toHaveProperty('icon');
      expect(typeof node.type).toBe('string');
      expect(typeof node.label).toBe('string');
    }
  });

  it('nodeCategories are defined', () => {
    expect(nodeCategories.length).toBeGreaterThan(0);
    for (const cat of nodeCategories) {
      expect(cat).toHaveProperty('label');
      expect(cat).toHaveProperty('nodes');
      expect(cat.nodes.length).toBeGreaterThan(0);
    }
  });

  it('voice_torpedo node is properly configured', () => {
    const voiceNode = actionOptions.find(n => n.type === 'voice_torpedo');
    expect(voiceNode).toBeDefined();
    expect(voiceNode!.label).toMatch(/Torpedo|Voz/i);
  });

  it('parallel (fishbone) node is properly configured', () => {
    const parallelNode = actionOptions.find(n => n.type === 'parallel');
    expect(parallelNode).toBeDefined();
  });

  it('link_split node is properly configured', () => {
    const splitNode = actionOptions.find(n => n.type === 'link_split');
    expect(splitNode).toBeDefined();
  });

  it('note node is properly configured', () => {
    const noteNode = actionOptions.find(n => n.type === 'note');
    expect(noteNode).toBeDefined();
  });
});
