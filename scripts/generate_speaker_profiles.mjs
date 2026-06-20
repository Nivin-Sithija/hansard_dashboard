import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = path.join(repoRoot, 'public', 'data');
const contentRoot = path.join(repoRoot, 'scripts', 'content');
const envPath = path.join(repoRoot, '.env');
const curatedPath = path.join(contentRoot, 'speaker_profiles.json');
const draftPath = path.join(contentRoot, 'speaker_profiles_draft.json');
const enrichedPath = path.join(dataRoot, 'speaker_profiles_enriched.json');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseArgs(argv) {
  const options = {
    limit: 12,
    force: false,
  };

  for (const token of argv) {
    if (token.startsWith('--limit=')) {
      options.limit = Number.parseInt(token.slice('--limit='.length), 10) || options.limit;
    } else if (token === '--force') {
      options.force = true;
    }
  }

  return options;
}

function compactProfile(profile) {
  return {
    speakerName: profile.name,
    displayName: profile.displayName,
    aliases: profile.aliases?.slice(0, 6) ?? [],
    totalSpeeches: profile.totalSpeeches,
    firstActiveYear: profile.firstActiveYear,
    lastActiveYear: profile.lastActiveYear,
    activeYearCount: profile.activeYearCount,
    peakYear: profile.peakYear,
    peakYearSpeechCount: profile.peakYearSpeechCount,
    topicCount: profile.topicCount,
    proceduralShare: profile.proceduralShare,
    speakerType: profile.speakerType ?? null,
    deterministicInsight: profile.insightSummary,
    dominantTopics: (profile.dominantTopics ?? []).slice(0, 3).map((topic) => ({
      topicLabel: topic.topicLabel,
      count: topic.count,
      share: topic.share,
    })),
    languageMix: (profile.languageMix ?? []).slice(0, 3),
    representativeSpeeches: (profile.representativeSpeeches ?? []).slice(0, 3).map((speech) => ({
      date: speech.date,
      year: speech.year,
      topicLabel: speech.topicLabel,
      language: speech.language,
      excerpt: speech.excerpt,
    })),
  };
}

async function resolveModel(apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Unable to list Anthropic models: ${response.status} ${text}`);
  }

  const payload = await response.json();
  const models = payload.data ?? [];
  const preferred = models.find((item) => item.id.includes('sonnet')) || models[0];
  if (!preferred?.id) {
    throw new Error('Anthropic returned no usable models.');
  }
  return preferred.id;
}

async function generateDraft(apiKey, model, profile) {
  const system = [
    'You are helping draft editorial profile notes for a public parliamentary research site.',
    'Use only the provided structured data.',
    'Do not invent offices, party affiliations, biographical facts, or Wikipedia claims.',
    'If the data is not enough for a true biography, write a corpus-grounded profile note instead.',
    'Return valid JSON only.',
  ].join(' ');

  const prompt = {
    task: 'Draft one short profile note and one editorial summary for a speaker profile card.',
    requirements: {
      shortBio: '1-2 sentences, grounded in the corpus data only, no invented facts.',
      editorialSummary: '1-2 sentences, public-facing, explains what kind of speaker this appears to be in the dataset.',
      speakerType: 'Choose one: specialist, generalist, crisis-period speaker, steady presence, emerging voice, procedural-heavy, low-evidence.',
      needsHumanReview: 'boolean, true unless the note is extremely straightforward.',
      confidenceNotes: 'Short sentence explaining any uncertainty.',
    },
    profile: compactProfile(profile),
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      system,
      messages: [
        {
          role: 'user',
          content: JSON.stringify(prompt),
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic request failed: ${response.status} ${text}`);
  }

  const payload = await response.json();
  const text = payload.content?.map((item) => item.text ?? '').join('').trim() ?? '';
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned);
}

async function main() {
  loadEnvFile(envPath);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY was not found in the environment.');
  }

  if (!fs.existsSync(enrichedPath)) {
    throw new Error('public/data/speaker_profiles_enriched.json is missing. Run `npm run build:data` first.');
  }

  const options = parseArgs(process.argv.slice(2));
  const enriched = loadJson(enrichedPath, []);
  const curated = loadJson(curatedPath, {});
  const drafts = loadJson(draftPath, {});
  const curatedNames = new Set(
    Object.values(curated)
      .filter((entry) => entry && typeof entry === 'object')
      .map((entry) => String(entry.speakerName || entry.name || '').toLowerCase())
      .filter(Boolean),
  );

  const queue = enriched
    .filter((profile) => options.force || !drafts[profile.name])
    .filter((profile) => !curatedNames.has(String(profile.name).toLowerCase()))
    .slice(0, options.limit);

  if (!queue.length) {
    console.log('No speakers queued for draft generation.');
    return;
  }

  const model = await resolveModel(apiKey);
  console.log(`Using Anthropic model ${model}`);

  for (const profile of queue) {
    console.log(`Generating draft for ${profile.displayName || profile.name}...`);
    const generated = await generateDraft(apiKey, model, profile);
    drafts[profile.name] = {
      speakerName: profile.name,
      slug: profile.slug,
      displayName: profile.displayName,
      shortBio: generated.shortBio ?? null,
      editorialSummary: generated.editorialSummary ?? null,
      speakerType: generated.speakerType ?? null,
      needsHumanReview: generated.needsHumanReview ?? true,
      confidenceNotes: generated.confidenceNotes ?? null,
      verified: false,
      generatedAt: new Date().toISOString(),
      model,
    };
  }

  fs.writeFileSync(draftPath, `${JSON.stringify(drafts, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${queue.length} draft speaker profiles to scripts/content/speaker_profiles_draft.json`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
