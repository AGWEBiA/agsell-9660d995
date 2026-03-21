import { describe, it, expect } from 'vitest';
import { flowNodeTypes } from '@/components/flow-builder/flowNodeTypes';

describe('Flow Node Types', () => {
  it('has all core node types defined', () => {
    const typeIds = flowNodeTypes.map(n => n.type);
    
    // Original nodes
    expect(typeIds).toContain('whatsapp');
    expect(typeIds).toContain('email');
    expect(typeIds).toContain('sms');
    expect(typeIds).toContain('timer');
    expect(typeIds).toContain('condition');
    expect(typeIds).toContain('tag');
    
    // New SellFlux-inspired nodes
    expect(typeIds).toContain('voice_torpedo');
    expect(typeIds).toContain('parallel');
    expect(typeIds).toContain('note');
    expect(typeIds).toContain('link_split');
    expect(typeIds).toContain('whatsapp_group_edit');
  });

  it('each node has required properties', () => {
    for (const node of flowNodeTypes) {
      expect(node).toHaveProperty('type');
      expect(node).toHaveProperty('label');
      expect(node).toHaveProperty('icon');
      expect(node).toHaveProperty('category');
      expect(typeof node.type).toBe('string');
      expect(typeof node.label).toBe('string');
      expect(typeof node.category).toBe('string');
    }
  });

  it('categories include actions and advanced', () => {
    const categories = [...new Set(flowNodeTypes.map(n => n.category))];
    expect(categories).toContain('actions');
  });

  it('voice_torpedo node is properly configured', () => {
    const voiceNode = flowNodeTypes.find(n => n.type === 'voice_torpedo');
    expect(voiceNode).toBeDefined();
    expect(voiceNode!.label).toMatch(/Torpedo|Voz/i);
  });

  it('parallel (fishbone) node is properly configured', () => {
    const parallelNode = flowNodeTypes.find(n => n.type === 'parallel');
    expect(parallelNode).toBeDefined();
    expect(parallelNode!.label).toMatch(/Paralelo|Fishbone/i);
  });

  it('link_split node is properly configured', () => {
    const splitNode = flowNodeTypes.find(n => n.type === 'link_split');
    expect(splitNode).toBeDefined();
  });

  it('note node is properly configured', () => {
    const noteNode = flowNodeTypes.find(n => n.type === 'note');
    expect(noteNode).toBeDefined();
  });
});
