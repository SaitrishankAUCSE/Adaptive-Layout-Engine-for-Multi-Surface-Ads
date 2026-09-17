/**
 * Deterministic Mock LLM Optimizer for Development and Demo environments.
 * 
 * Provides deterministic copy shortening to demonstrate the AI "Enhance to Fit"
 * workflow without requiring external API keys.
 * 
 * Guarantees:
 * 1. Fully deterministic string transformations (pure functions).
 * 2. Shortens copy by removing filler, verbosity, and clipping to target lengths.
 * 3. Preserves original meaning, brand keywords, and CTA intent.
 * 4. Generates standard JSON payloads that undergo identical schema and layout validation.
 */

const FILLER_PHRASES: RegExp[] = [
  /\bintroducing our brand new\b/gi,
  /\bintroducing the all-new\b/gi,
  /\bintroducing our\b/gi,
  /\bintroducing the\b/gi,
  /\bintroducing\b/gi,
  /\bexperience the all-new\b/gi,
  /\bexperience the\b/gi,
  /\bdiscover the power of\b/gi,
  /\bdiscover our\b/gi,
  /\bdesigned specifically to\b/gi,
  /\bdesigned specifically for\b/gi,
  /\bdesigned to empower\b/gi,
  /\bdesigned to\b/gi,
  /\bengineered specifically to\b/gi,
  /\bengineered specifically for\b/gi,
  /\bengineered for modern\b/gi,
  /\bengineered to\b/gi,
  /\bbuilt specifically to\b/gi,
  /\bbuilt to deliver\b/gi,
  /\bbuilt for\b/gi,
  /\bempowering teams with\b/gi,
  /\bthe ultimate\b/gi,
  /\ball-new\b/gi,
  /\bnext-generation\b/gi,
  /\bstate-of-the-art\b/gi,
  /\bunparalleled\b/gi,
  /\bunprecedented\b/gi,
  /\brevolutionary\b/gi,
  /\bcutting-edge\b/gi,
  /\beffortlessly\b/gi,
  /\bseamlessly\b/gi,
  /\bincredibly\b/gi,
  /\bextremely\b/gi,
  /\babsolutely\b/gi,
  /\btruly\b/gi,
  /\bspecifically to\b/gi,
  /\bspecifically for\b/gi,
  /\bspecifically\b/gi,
];

const DANGLING_WORDS = new Set([
  'and', 'or', 'with', 'for', 'to', 'in', 'at', 'the', 'a', 'an', 'by', 'of', 'from', 'on'
]);

function cleanPunctuationAndSpacing(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:—-])/g, '$1')
    .replace(/[,;—:-]+$/g, '')
    .trim();
}

function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Truncates at a natural word boundary within maxChars, avoiding mid-word breaks
 * and pruning trailing dangling prepositions/conjunctions.
 */
export function truncateAtWordBoundary(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;

  const substr = text.slice(0, maxChars);
  const lastSpaceIdx = substr.lastIndexOf(' ');

  let result = lastSpaceIdx > 6 ? substr.slice(0, lastSpaceIdx) : substr;
  result = result.replace(/[,;—:.-]+$/g, '').trim();

  const words = result.split(' ');
  while (words.length > 1 && DANGLING_WORDS.has(words[words.length - 1].toLowerCase())) {
    words.pop();
  }

  return words.join(' ');
}

/**
 * Shorten headline deterministically:
 * - Target <= 35 characters
 * - Strip puffery/filler phrases
 * - Intelligently shorten while preserving subject/noun phrase
 */
export function shortenHeadline(headline: string, maxChars = 35): string {
  const original = headline.trim();
  if (original.length <= maxChars) return original;

  let cleaned = original;
  for (const pattern of FILLER_PHRASES) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  cleaned = cleanPunctuationAndSpacing(cleaned);

  if (cleaned.length <= maxChars && cleaned.length >= 5) {
    return capitalizeFirst(cleaned);
  }

  // If there's a primary clause (e.g. split by ':', '—', '|', or spaced dash ' - ')
  const clauseSplit = cleaned.split(/(?:\s+[-—–]\s+|[:|—–])/);
  if (clauseSplit.length > 1) {
    const primary = cleanPunctuationAndSpacing(clauseSplit[0]);
    if (primary.length >= 6 && primary.length <= maxChars) {
      return capitalizeFirst(primary);
    }
  }

  const truncated = truncateAtWordBoundary(cleaned.length >= 5 ? cleaned : original, maxChars);
  return capitalizeFirst(truncated || original.slice(0, maxChars));
}

/**
 * Shorten description deterministically:
 * - Target <= 60 characters
 * - Strip puffery/filler phrases
 * - Keep first complete sentence or truncate cleanly at word boundary
 * - Ensure proper terminal punctuation
 */
export function shortenDescription(description: string, maxChars = 60): string {
  const original = description.trim();
  if (original.length <= maxChars) return original;

  let cleaned = original;
  for (const pattern of FILLER_PHRASES) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  cleaned = cleanPunctuationAndSpacing(cleaned);

  // If there's a clean first sentence that fits
  const firstSentenceMatch = cleaned.match(/^([^.!?]+[.!?])/);
  if (firstSentenceMatch && firstSentenceMatch[1].length <= maxChars && firstSentenceMatch[1].length >= 15) {
    return capitalizeFirst(firstSentenceMatch[1].trim());
  }

  const base = cleaned.length >= 8 ? cleaned : original;
  const truncated = truncateAtWordBoundary(base, maxChars - 1);
  const formatted = capitalizeFirst(truncated.replace(/[.]+$/g, ''));
  return formatted ? `${formatted}.` : original;
}

/**
 * Preserve and optimize CTA:
 * - If <= 20 characters, preserve verbatim
 * - If excessively long, trim filler words while preserving core verb & noun
 */
export function shortenCta(cta: string, maxChars = 20): string {
  const original = cta.trim();
  if (!original) return 'Learn More';
  if (original.length <= maxChars) return original;

  // If there's a strong action keyword and target noun, prioritize punchy CTA phrase
  const actionMatch = original.match(/\b(start|claim|get|try|join|explore|shop|buy|order|discover|book|unlock)\b/i);
  const targetMatch = original.match(/\b(trial|demo|discount|offer|deal|access|quote|membership|app|service|now|today)\b/i);
  if (actionMatch && targetMatch && targetMatch[1].toLowerCase() !== actionMatch[1].toLowerCase()) {
    const candidate = capitalizeFirst(`${actionMatch[1]} ${targetMatch[1]}`);
    if (candidate.length <= maxChars) {
      return candidate;
    }
  }

  let cleaned = original
    .replace(/\b(click here to|click right now to|click to|click here|click|right now|your|now|today|our|enterprise|cloud|database|14-day|30-day|free)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length > maxChars) {
    cleaned = truncateAtWordBoundary(cleaned, maxChars);
  }

  return capitalizeFirst(cleaned) || original.slice(0, maxChars);
}

/**
 * Parse structured optimization prompt sent by frontend:
 * Headline: "..."
 * Description: "..."
 * CTA: "..."
 */
export function parseOptimizationPrompt(prompt: string): {
  headline: string;
  description: string;
  cta: string;
} | null {
  const headlineMatch = prompt.match(/Headline:\s*"([\s\S]*?)"\s*(?:\r?\n|$)/i);
  const descMatch = prompt.match(/Description:\s*"([\s\S]*?)"\s*(?:\r?\n|$)/i);
  const ctaMatch = prompt.match(/CTA:\s*"([\s\S]*?)"\s*(?:\r?\n|$)/i);

  if (headlineMatch && descMatch && ctaMatch) {
    return {
      headline: headlineMatch[1].trim(),
      description: descMatch[1].trim(),
      cta: ctaMatch[1].trim(),
    };
  }
  return null;
}

/**
 * Generates mock response elements deterministically based on prompt input.
 */
export function generateDeterministicMockElements(prompt: string) {
  const structured = parseOptimizationPrompt(prompt);

  if (structured) {
    return [
      {
        id: 'headline',
        type: 'headline' as const,
        content: shortenHeadline(structured.headline),
        priority: 1 as const,
      },
      {
        id: 'subtext',
        type: 'subtext' as const,
        content: shortenDescription(structured.description),
        priority: 2 as const,
      },
      {
        id: 'cta',
        type: 'cta' as const,
        content: shortenCta(structured.cta),
        priority: 1 as const,
      },
    ];
  }

  // General prompt fallback (e.g. from AdEditor prompt input)
  const clean = prompt.replace(/^mock:\s*/i, '').trim();
  const baseHeadline = clean.length > 35 ? shortenHeadline(clean, 35) : `Experience ${clean}`;
  return [
    {
      id: 'headline',
      type: 'headline' as const,
      content: baseHeadline,
      priority: 1 as const,
    },
    {
      id: 'subtext',
      type: 'subtext' as const,
      content: 'High-performance design built for daily excellence.',
      priority: 2 as const,
    },
    {
      id: 'cta',
      type: 'cta' as const,
      content: 'Discover Now',
      priority: 1 as const,
    },
  ];
}
