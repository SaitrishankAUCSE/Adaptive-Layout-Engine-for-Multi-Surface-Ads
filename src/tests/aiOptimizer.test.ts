import { describe, expect, it } from 'vitest';
import { validateCandidate } from '../engine/aiOptimizer';
import type { AdElement, Surface } from '../engine/types';

describe('AI Optimizer Validation Logic', () => {
  const dummySurfaces: Surface[] = [
    { id: '1', name: 'Banner', width: 728, height: 90 },
    { id: '2', name: 'Square', width: 300, height: 300 },
  ];

  // Helper to create basic elements
  const createElements = (headline: string, subtext: string): AdElement[] => [
    { id: 'img', type: 'image', content: 'img.jpg', priority: 1 },
    { id: 'logo', type: 'logo', content: 'logo.png', priority: 1 },
    { id: 'head', type: 'headline', content: headline, priority: 1 },
    { id: 'sub', type: 'subtext', content: subtext, priority: 2 },
    { id: 'cta', type: 'cta', content: 'Click', priority: 1 },
  ];

  it('accepts candidate that improves total perfect fits', () => {
    // A very long text that overflows both
    const before = createElements(
      'Super Long Headline That Will Overflow The Banner And Square Completely',
      'This subtext is also incredibly long and will definitely not fit anywhere because it is so incredibly massive.'
    );
    
    // A concise text that fits both
    const after = createElements('Short Head', 'Short sub');

    const result = validateCandidate(before, after, dummySurfaces);
    
    expect(result.success).toBe(true);
    expect(result.beforeMetrics.perfectFits).toBe(1);
    expect(result.afterMetrics.perfectFits).toBe(2);
  });

  it('rejects candidate if a previously fitting surface now fails', () => {
    // Current text fits banner fine but fails square (mocking scenario)
    // Actually, short text fits both.
    const before = createElements('Short', 'Short');
    // After: AI makes it MASSIVE and breaks everything
    const after = createElements('Massive headline that breaks all previous perfect fits', 'Massive subtext that also breaks everything');

    const result = validateCandidate(before, after, dummySurfaces);
    
    expect(result.success).toBe(false);
    expect(result.reason).toContain('broke layout');
  });

  it('rejects candidate if it hides priority 1 elements', () => {
    // Say the current elements hide a priority 2 element (subtext). 
    // AI changes it such that the subtext is short but headline is MASSIVE, pushing headline (P1) out.
    const before = createElements('Normal', 'Very long subtext that gets hidden');
    const after = createElements('Very long headline that gets hidden', 'Normal');

    const result = validateCandidate(before, after, dummySurfaces);
    
    // It should reject if P1 hidden count increases
    expect(result.success).toBe(false);
  });

  it('rejects candidate if it does not improve score', () => {
    const before = createElements('Same', 'Same');
    const after = createElements('Same', 'Same');

    const result = validateCandidate(before, after, dummySurfaces);
    
    expect(result.success).toBe(false);
    expect(result.reason).toContain('did not improve');
  });
});

import {
  shortenHeadline,
  shortenDescription,
  shortenCta,
  generateDeterministicMockElements,
  parseOptimizationPrompt,
} from '../engine/mockOptimizer';

describe('Deterministic Mock LLM Optimizer', () => {
  it('is strictly deterministic across multiple runs with identical input', () => {
    const prompt = `Rewrite the following ad copy to be concise while strictly preserving the original meaning, brand intent, and CTA intent.
Headline: "Introducing Our Brand New Ultra-Fast Cloud Platform For Distributed Teams"
Description: "Engineered specifically to empower modern distributed teams with real-time sync and zero downtime."
CTA: "Start Your Free 14-Day Enterprise Trial Today"`;

    const run1 = generateDeterministicMockElements(prompt);
    const run2 = generateDeterministicMockElements(prompt);

    expect(run1).toEqual(run2);
  });

  it('extracts and shortens actual user copy rather than returning generic placeholder', () => {
    const userHeadline = 'Revolutionary Multi-Surface Advertising Engine For Brands';
    const userDesc = 'Designed specifically to deliver real-time collision-free layouts across all devices with zero manual tweaking.';
    const userCta = 'Experience The Platform Now';

    const prompt = `Headline: "${userHeadline}"\nDescription: "${userDesc}"\nCTA: "${userCta}"`;
    const parsed = parseOptimizationPrompt(prompt);
    expect(parsed).not.toBeNull();
    expect(parsed?.headline).toBe(userHeadline);

    const elements = generateDeterministicMockElements(prompt);
    const headline = elements.find(e => e.type === 'headline')?.content;
    const subtext = elements.find(e => e.type === 'subtext')?.content;
    const cta = elements.find(e => e.type === 'cta')?.content;

    // Check that elements are actual shortened versions of the user's input
    expect(headline).toBeDefined();
    expect(headline!.length).toBeLessThanOrEqual(35);
    expect(headline).not.toContain('Experience Premium'); // Not the old hardcoded template
    expect(headline).toContain('Advertising Engine'); // Preserved user keyword

    expect(subtext).toBeDefined();
    expect(subtext!.length).toBeLessThanOrEqual(60);
    expect(subtext).not.toContain('Discover next-generation'); // Not the old hardcoded template
    expect(subtext).toContain('layouts'); // Preserved user intent

    expect(cta).toBeDefined();
    expect(cta!.length).toBeLessThanOrEqual(20);
  });

  it('shortenHeadline removes filler puffery and preserves subject', () => {
    const long = 'Introducing The All-New State-Of-The-Art Smart Running Shoe';
    const shortened = shortenHeadline(long, 35);
    expect(shortened.length).toBeLessThanOrEqual(35);
    expect(shortened.toLowerCase()).not.toContain('introducing');
    expect(shortened.toLowerCase()).not.toContain('state-of-the-art');
    expect(shortened.toLowerCase()).toContain('running shoe');
  });

  it('shortenDescription targets under 60 chars and ensures terminal punctuation', () => {
    const long = 'Engineered specifically to help marathon runners improve pace and avoid fatigue with intelligent cushioning technology.';
    const shortened = shortenDescription(long, 60);
    expect(shortened.length).toBeLessThanOrEqual(60);
    expect(shortened.endsWith('.')).toBe(true);
    expect(shortened.toLowerCase()).not.toContain('specifically to');
  });

  it('shortenCta preserves short CTA and trims long CTA', () => {
    expect(shortenCta('Buy Now')).toBe('Buy Now');
    expect(shortenCta('Get Started')).toBe('Get Started');
    const longCta = 'Claim Your Free 30-Day Enterprise Trial Today';
    const trimmed = shortenCta(longCta);
    expect(trimmed.length).toBeLessThanOrEqual(20);
    expect(trimmed.toLowerCase()).toContain('trial');
  });

  it('integrates with validateCandidate: genuinely improves long overflowing copy', () => {
    const dummySurfaces: Surface[] = [
      { id: '1', name: 'Banner', width: 728, height: 90 },
      { id: '2', name: 'Square', width: 300, height: 300 },
    ];

    // Current elements with long text that forces subtext out on Banner
    const before: AdElement[] = [
      { id: 'img', type: 'image', content: 'img.jpg', priority: 1 },
      { id: 'logo', type: 'logo', content: 'logo.png', priority: 1 },
      { id: 'head', type: 'headline', content: 'Introducing Our Brand New Revolutionary Ultra-Fast Cloud Platform For Distributed Engineering Teams Across All Global Continents', priority: 1 },
      { id: 'sub', type: 'subtext', content: 'Designed specifically to empower modern distributed teams with real-time sync, automated continuous deployment, and enterprise encryption.', priority: 2 },
      { id: 'cta', type: 'cta', content: 'Start Your Free 14-Day Enterprise Trial Today', priority: 1 },
    ];

    // Generate mock candidate elements from prompt
    const prompt = `Headline: "${before[2].content}"\nDescription: "${before[3].content}"\nCTA: "${before[4].content}"`;
    const mockElements = generateDeterministicMockElements(prompt);

    const candidate: AdElement[] = before.map(el => {
      const match = mockElements.find(m => m.type === el.type);
      return match ? { ...el, content: match.content } : el;
    });

    const validationResult = validateCandidate(before, candidate, dummySurfaces);

    // The shortened copy must genuinely improve the layout
    expect(validationResult.success).toBe(true);
    expect(validationResult.afterMetrics.perfectFits).toBeGreaterThanOrEqual(validationResult.beforeMetrics.perfectFits);
  });

  it('integrates with validateCandidate: rejects mock candidate if already optimal', () => {
    const dummySurfaces: Surface[] = [
      { id: '1', name: 'Banner', width: 728, height: 90 },
      { id: '2', name: 'Square', width: 300, height: 300 },
    ];

    // Current elements are already short and 100% fitting
    const before: AdElement[] = [
      { id: 'img', type: 'image', content: 'img.jpg', priority: 1 },
      { id: 'logo', type: 'logo', content: 'logo.png', priority: 1 },
      { id: 'head', type: 'headline', content: 'Cloud Platform', priority: 1 },
      { id: 'sub', type: 'subtext', content: 'Fast microservices.', priority: 2 },
      { id: 'cta', type: 'cta', content: 'Start Trial', priority: 1 },
    ];

    const prompt = `Headline: "${before[2].content}"\nDescription: "${before[3].content}"\nCTA: "${before[4].content}"`;
    const mockElements = generateDeterministicMockElements(prompt);

    const candidate: AdElement[] = before.map(el => {
      const match = mockElements.find(m => m.type === el.type);
      return match ? { ...el, content: match.content } : el;
    });

    const validationResult = validateCandidate(before, candidate, dummySurfaces);

    // Because it was already optimal, mock candidate does not improve score and is rejected!
    expect(validationResult.success).toBe(false);
    expect(validationResult.reason).toContain('did not improve');
  });
});
