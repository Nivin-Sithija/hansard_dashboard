import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np

REPO_ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = REPO_ROOT.parent / 'lk-hansard-topic-modeling' / 'artifacts' / 'final_v14'
TARGET_DATA = REPO_ROOT / 'public' / 'data'
CONTENT_ROOT = REPO_ROOT / 'scripts' / 'content'

TEMPORAL_PATH = TARGET_DATA / 'macro_topic_temporal_evolution_chart_data.json'
KEYWORDS_PATH = TARGET_DATA / 'macro_topic_keywords_100.json'
SPEAKER_COUNTS_PATH = TARGET_DATA / 'speaker_topic_counts_by_macro_topic.json'
SPEAKER_NORMALIZATION_PATH = TARGET_DATA / 'speaker_normalization.json'
TOPIC_RESOURCES_PATH = CONTENT_ROOT / 'topic_resources.json'
FINAL_SPEAKERS_PATH = TARGET_DATA / 'final_unique_speakers.json'
SPEAKER_ACTIVITY_PATH = TARGET_DATA / 'speaker_speeches_per_year_by_topic.json'
SPEAKER_PROFILES_PATH = CONTENT_ROOT / 'speaker_profiles.json'
SPEAKER_PROFILE_DRAFTS_PATH = CONTENT_ROOT / 'speaker_profiles_draft.json'

ASSIGNMENTS_PATH = SOURCE_ROOT / 'macro_topic_assignments.csv'
SPEECHES_PATH = SOURCE_ROOT / 'all_speakers.csv'
UMAP_PATH = SOURCE_ROOT / 'umap2.npy'

NUMERIC_TOKEN = re.compile(r'^[0-9,.-]+$')
WS = re.compile(r'\s+')
MARKDOWN_BOLD = re.compile(r'\*\*')


def load_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def clean_text(text: str) -> str:
    text = MARKDOWN_BOLD.sub('', text or '')
    text = text.replace('?', '"').replace('?', '"').replace('?', "'")
    text = WS.sub(' ', text).strip()
    return text


def make_excerpt(text: str, limit: int = 240) -> str:
    if len(text) <= limit:
        return text
    clipped = text[:limit].rsplit(' ', 1)[0].strip()
    return f'{clipped}?'


def detect_language(text: str) -> str:
    sinhala = sum(0x0D80 <= ord(ch) <= 0x0DFF for ch in text)
    tamil = sum(0x0B80 <= ord(ch) <= 0x0BFF for ch in text)
    latin = sum(('A' <= ch <= 'Z') or ('a' <= ch <= 'z') for ch in text)
    active = sum(count > 6 for count in (sinhala, tamil, latin))
    if active >= 2:
        return 'Mixed'
    if sinhala >= tamil and sinhala >= latin and sinhala > 0:
        return 'Sinhala'
    if tamil >= sinhala and tamil >= latin and tamil > 0:
        return 'Tamil'
    return 'English'


def topic_key(topic_id: int | None) -> str:
    return 'noise' if topic_id is None else str(topic_id)


def load_topic_resources(path: Path):
    if not path.exists():
        return {}
    payload = load_json(path)
    return payload if isinstance(payload, dict) else {}


def load_optional_json(path: Path, default):
    if not path.exists():
        return default
    payload = load_json(path)
    return payload if isinstance(payload, type(default)) else default


def normalize_resource(item: dict) -> dict:
    return {
        'id': item['id'],
        'type': item['type'],
        'title': item['title'],
        'url': item['url'],
        'publisher': item['publisher'],
        'publishedAt': item.get('publishedAt'),
        'year': item.get('year'),
        'summary': item.get('summary', ''),
        'whyRelevant': item.get('whyRelevant', ''),
        'sourceQuality': item.get('sourceQuality', 'news'),
        'verified': bool(item.get('verified', False)),
    }


def normalize_event(item: dict) -> dict:
    return {
        'id': item['id'],
        'title': item['title'],
        'date': item.get('date'),
        'dateRange': item.get('dateRange'),
        'summary': item.get('summary', ''),
        'whyLinked': item.get('whyLinked', ''),
        'topicKeys': item.get('topicKeys', []),
        'sourceIds': item.get('sourceIds', []),
    }


def profile_match_key(entry: dict) -> str:
    value = entry.get('speakerName') or entry.get('name') or entry.get('slug') or ''
    return str(value).strip().lower()


def normalize_profile_entry(entry: dict) -> dict:
    return {
        'speakerName': entry.get('speakerName') or entry.get('name') or '',
        'slug': entry.get('slug'),
        'displayName': entry.get('displayName'),
        'shortBio': entry.get('shortBio'),
        'wikipediaUrl': entry.get('wikipediaUrl'),
        'wikidataId': entry.get('wikidataId'),
        'officialProfileUrl': entry.get('officialProfileUrl'),
        'party': entry.get('party'),
        'constituency': entry.get('constituency'),
        'verified': bool(entry.get('verified', False)),
        'editorialSummary': entry.get('editorialSummary'),
        'speakerType': entry.get('speakerType'),
        'needsHumanReview': bool(entry.get('needsHumanReview', False)),
        'confidenceNotes': entry.get('confidenceNotes'),
        'generatedAt': entry.get('generatedAt'),
        'model': entry.get('model'),
    }


def profile_lookup(payload: dict | list) -> dict:
    entries = payload.values() if isinstance(payload, dict) else payload
    lookup = {}
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        normalized = normalize_profile_entry(entry)
        keys = {
            profile_match_key(entry),
            str(normalized.get('slug') or '').strip().lower(),
            str(normalized.get('speakerName') or '').strip().lower(),
        }
        for key in keys:
            if key:
                lookup[key] = normalized
    return lookup


def format_topic_color(color: list[int]) -> str:
    return f"rgb({color[0]}, {color[1]}, {color[2]})"


def compact_language_mix(counter: Counter) -> list[dict]:
    total = sum(counter.values()) or 1
    return [
        {
            'language': language,
            'count': count,
            'share': round(count / total, 4),
        }
        for language, count in counter.most_common()
    ]


def build_representative_speeches(records: list[dict], dominant_topic_keys: list[str]) -> list[dict]:
    candidates = [record for record in records if not record['isNoise']]
    if not candidates:
        candidates = records[:]

    selected = []
    seen = set()
    for topic in dominant_topic_keys:
        topic_matches = [record for record in candidates if record['topicKey'] == topic]
        topic_matches.sort(key=lambda item: (len(item['excerpt']), item['year']), reverse=True)
        if topic_matches:
            choice = topic_matches[0]
            if choice['speechId'] not in seen:
                selected.append(choice)
                seen.add(choice['speechId'])
        if len(selected) >= 4:
            break

    fallback = sorted(candidates, key=lambda item: (item['year'], len(item['excerpt'])), reverse=True)
    for record in fallback:
        if record['speechId'] in seen:
            continue
        selected.append(record)
        seen.add(record['speechId'])
        if len(selected) >= 4:
            break

    return [
        {
            'speechId': item['speechId'],
            'date': item['date'],
            'year': item['year'],
            'topicId': item['topicId'],
            'topicKey': item['topicKey'],
            'topicLabel': item['topicLabel'],
            'language': item['language'],
            'excerpt': item['excerpt'],
        }
        for item in selected
    ]


def build_speaker_insight(
    active_years: list[int],
    dominant_topics: list[dict],
    peak_year: int | None,
    peak_count: int,
    procedural_share: float,
) -> str:
    clauses = []
    if active_years:
        if len(active_years) == 1:
            clauses.append(f"Visible in the clustered record in {active_years[0]}.")
        elif active_years[0] >= 2022:
            clauses.append(f"Appears mainly in the later corpus window ({active_years[0]}-{active_years[-1]}).")
        else:
            clauses.append(f"Active across {active_years[0]}-{active_years[-1]} in the clustered Hansard corpus.")

    if dominant_topics:
        lead = dominant_topics[0]
        if lead['share'] >= 0.55:
            clauses.append(f"Concentrates strongly on {lead['topicLabel']}.")
        elif lead['share'] >= 0.35:
            clauses.append(f"Leans most toward {lead['topicLabel']}, while still appearing in other debates.")
        else:
            clauses.append(f"Participates across several macro-topics, with {lead['topicLabel']} as the largest share.")

    if peak_year:
        period_labels = {
            2019: 'the post-Easter security debate',
            2020: 'the pandemic and constitutional-change period',
            2021: 'the fertilizer-ban and economic-strain period',
            2022: 'the economic-crisis and Aragalaya period',
        }
        period = period_labels.get(peak_year)
        if period:
            clauses.append(f"Peaks in {peak_year} during {period}, with {peak_count} attributed speeches.")
        else:
            clauses.append(f"Peaks in {peak_year} with {peak_count} attributed speeches.")

    if procedural_share >= 0.45:
        clauses.append('A large share of the attributed record is procedural rather than substantive.')

    return ' '.join(clauses[:3]).strip()


def build_speaker_profiles(
    final_speakers: list[dict],
    speaker_activity: dict,
    speech_records: list[dict],
    topic_metadata: dict,
    curated_profiles: dict,
    draft_profiles: dict,
) -> list[dict]:
    profiles = {}
    canonical_by_variant = {}

    for speaker in final_speakers:
        canonical_name = speaker['name']
        for variant in [canonical_name, speaker.get('manthriName'), speaker.get('slug'), *(speaker.get('aliases') or [])]:
            if variant:
                canonical_by_variant[str(variant).strip().lower()] = canonical_name
        profiles[canonical_name] = {
            'name': speaker['name'],
            'displayName': speaker.get('manthriName') or ((speaker.get('aliases') or [speaker['name']])[0]),
            'englishName': speaker.get('manthriName') or None,
            'aliases': speaker.get('aliases') or [],
            'slug': speaker.get('slug'),
            'imagePath': speaker.get('localPath'),
            'imageUrl': speaker.get('imageUrl'),
            'totalSpeeches': int(speaker.get('total_speeches') or 0),
            'byTopic': defaultdict(int),
            'byYear': defaultdict(int),
        }

    for topic_name, topic_bucket in (speaker_activity.get('by_topic') or {}).items():
        for speaker_name, stats in (topic_bucket.get('speakers') or {}).items():
            canonical_name = canonical_by_variant.get(str(speaker_name).strip().lower(), speaker_name)
            profile = profiles.setdefault(
                canonical_name,
                {
                    'name': canonical_name,
                    'displayName': canonical_name,
                    'englishName': None,
                    'aliases': [],
                    'slug': None,
                    'imagePath': None,
                    'imageUrl': None,
                    'totalSpeeches': 0,
                    'byTopic': defaultdict(int),
                    'byYear': defaultdict(int),
                },
            )
            total = int(stats.get('total') or 0)
            profile['totalSpeeches'] = max(profile['totalSpeeches'], total)
            profile['byTopic'][topic_name] += total
            for year, count in (stats.get('by_year') or {}).items():
                profile['byYear'][int(year)] += int(count)

    speeches_by_speaker = defaultdict(list)
    language_by_speaker = defaultdict(Counter)
    for record in speech_records:
        canonical_name = canonical_by_variant.get(str(record['speaker']).strip().lower(), record['speaker'])
        normalized_record = dict(record)
        normalized_record['speaker'] = canonical_name
        speeches_by_speaker[canonical_name].append(normalized_record)
        language_by_speaker[canonical_name][record['language']] += 1

    enriched = []
    for profile in profiles.values():
        records = sorted(speeches_by_speaker.get(profile['name'], []), key=lambda item: item['date'], reverse=True)
        if not profile['byYear'] and records:
            for record in records:
                profile['byYear'][int(record['year'])] += 1
        if not profile['byTopic'] and records:
            for record in records:
                if record['isNoise']:
                    continue
                profile['byTopic'][f"Macro-Topic {record['topicKey']}"] += 1

        active_years = sorted(year for year, count in profile['byYear'].items() if count > 0)
        peak_year = None
        peak_count = 0
        if profile['byYear']:
            peak_year, peak_count = max(profile['byYear'].items(), key=lambda item: item[1])

        dominant_topics = []
        substantive_total = 0
        for topic_name, count in profile['byTopic'].items():
            topic_id = topic_name.replace('Macro-Topic ', '')
            metadata = topic_metadata.get(topic_id)
            if metadata is None:
                continue
            substantive_total += count
            dominant_topics.append(
                {
                    'topicId': metadata['topicId'],
                    'topicKey': metadata['topicKey'],
                    'topicLabel': metadata['topicLabel'],
                    'count': count,
                    'share': 0,
                    'color': format_topic_color(metadata['color']),
                }
            )

        dominant_topics.sort(key=lambda item: item['count'], reverse=True)
        for item in dominant_topics:
            item['share'] = round(item['count'] / substantive_total, 4) if substantive_total else 0

        non_noise_total = sum(1 for item in records if not item['isNoise'])
        procedural_share = round((len(records) - non_noise_total) / len(records), 4) if records else 0
        representative = build_representative_speeches(records, [item['topicKey'] for item in dominant_topics[:3]])
        language_mix = compact_language_mix(language_by_speaker.get(profile['name'], Counter()))
        insight = build_speaker_insight(active_years, dominant_topics, peak_year, peak_count, procedural_share)

        curated = curated_profiles.get(profile['name'].lower()) or curated_profiles.get(str(profile.get('slug') or '').lower())
        draft = draft_profiles.get(profile['name'].lower()) or draft_profiles.get(str(profile.get('slug') or '').lower())
        short_bio = (curated or {}).get('shortBio') or (draft or {}).get('shortBio')
        short_bio_source = 'curated' if curated and curated.get('shortBio') else 'draft' if draft and draft.get('shortBio') else None

        enriched.append(
            {
                'name': profile['name'],
                'displayName': (curated or {}).get('displayName') or profile['displayName'],
                'englishName': profile['englishName'],
                'aliases': profile['aliases'],
                'slug': (curated or {}).get('slug') or profile.get('slug'),
                'imagePath': profile['imagePath'],
                'imageUrl': profile['imageUrl'],
                'totalSpeeches': profile['totalSpeeches'],
                'firstActiveYear': active_years[0] if active_years else None,
                'lastActiveYear': active_years[-1] if active_years else None,
                'activeYears': active_years,
                'activeYearCount': len(active_years),
                'peakYear': peak_year,
                'peakYearSpeechCount': peak_count,
                'topicCount': len(dominant_topics),
                'proceduralShare': procedural_share,
                'dominantTopics': dominant_topics[:6],
                'yearlyCounts': [{'year': year, 'count': profile['byYear'][year]} for year in active_years],
                'languageMix': language_mix,
                'representativeSpeeches': representative,
                'insightSummary': insight,
                'shortBio': short_bio,
                'shortBioSource': short_bio_source,
                'editorialSummary': (curated or {}).get('editorialSummary') or (draft or {}).get('editorialSummary'),
                'speakerType': (curated or {}).get('speakerType') or (draft or {}).get('speakerType'),
                'profileVerified': bool((curated or {}).get('verified', False)),
                'needsHumanReview': bool((draft or {}).get('needsHumanReview', False)),
                'confidenceNotes': (draft or {}).get('confidenceNotes'),
                'generatedAt': (draft or {}).get('generatedAt'),
                'model': (draft or {}).get('model'),
                'wikipediaUrl': (curated or {}).get('wikipediaUrl'),
                'wikidataId': (curated or {}).get('wikidataId'),
                'officialProfileUrl': (curated or {}).get('officialProfileUrl'),
                'party': (curated or {}).get('party'),
                'constituency': (curated or {}).get('constituency'),
            }
        )

    return sorted(enriched, key=lambda item: item['totalSpeeches'], reverse=True)


def build_topic_companion(topic_resources: dict, topic_metadata: dict) -> tuple[dict, dict]:
    event_sources = {}
    companion = {}

    for key, metadata in topic_metadata.items():
        authored = topic_resources.get(key, {})
        resources = [normalize_resource(item) for item in authored.get('resources', [])]
        related_events = [normalize_event(item) for item in authored.get('relatedEvents', [])]
        keywords_to_events = authored.get('keywordsToEvents', [])

        for resource in resources:
            event_sources[resource['id']] = resource

        companion[key] = {
            'topicId': metadata['topicId'],
            'topicKey': metadata['topicKey'],
            'topicLabel': metadata['topicLabel'],
            'resources': resources,
            'relatedEvents': related_events,
        }
        if keywords_to_events:
            companion[key]['keywordsToEvents'] = keywords_to_events

        verified_resources = [resource for resource in resources if resource['verified']]
        metadata['resourceCount'] = len(resources)
        metadata['eventCount'] = len(related_events)
        metadata['hasExternalEvidence'] = bool(verified_resources or related_events)

    return companion, event_sources


def main() -> None:
    TARGET_DATA.mkdir(parents=True, exist_ok=True)

    temporal = load_json(TEMPORAL_PATH)
    keywords = load_json(KEYWORDS_PATH)
    speaker_counts = load_json(SPEAKER_COUNTS_PATH)
    speaker_norm = load_json(SPEAKER_NORMALIZATION_PATH)
    topic_resources = load_topic_resources(TOPIC_RESOURCES_PATH)
    final_speakers = load_optional_json(FINAL_SPEAKERS_PATH, [])
    speaker_activity = load_optional_json(SPEAKER_ACTIVITY_PATH, {})
    curated_profiles = profile_lookup(load_optional_json(SPEAKER_PROFILES_PATH, {}))
    draft_profiles = profile_lookup(load_optional_json(SPEAKER_PROFILE_DRAFTS_PATH, {}))

    topic_labels = temporal['topic_labels']
    topic_colors = {
        str(item['mt_id']): [round(channel * 255) for channel in item['styles']['standard_chart']['color_rgba']]
        for item in temporal['series']
    }
    yearly_counts = {
        str(item['mt_id']): {int(point['year']): int(point['count']) for point in item['points']}
        for item in temporal['series']
    }

    assignments = []
    with ASSIGNMENTS_PATH.open(encoding='utf-8', newline='') as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            assignments.append(row)

    speeches_by_id = {}
    with SPEECHES_PATH.open(encoding='utf-8', newline='') as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            normalized = {key.replace('\ufeff', ''): value for key, value in row.items()}
            speeches_by_id[normalized['speech_id']] = normalized

    coords = np.load(UMAP_PATH)
    if len(coords) != len(assignments):
        raise ValueError(f'UMAP coordinate count {len(coords)} does not match modeled assignments {len(assignments)}')

    language_totals = Counter()
    topic_language_totals = defaultdict(Counter)
    topic_samples = defaultdict(list)
    speech_records = []
    atlas_points = []

    for index, assignment in enumerate(assignments):
        speech_id = assignment['speech_id']
        row = speeches_by_id.get(speech_id)
        if row is None:
            continue
        raw_topic = assignment.get('macro_topic', 'Procedural Noise')
        is_noise = raw_topic == 'Procedural Noise'
        topic_id = None if is_noise else int(raw_topic.split()[-1])
        t_key = topic_key(topic_id)
        label = 'Procedural Noise' if is_noise else topic_labels[str(topic_id)]
        clean = clean_text(row['text'])
        excerpt = make_excerpt(clean)
        language = detect_language(clean)
        speaker = speaker_norm.get(row['speaker'], row['speaker'])
        year = int(str(row['date'])[:4])
        point_x, point_y = coords[index]

        record = {
            'speechId': speech_id,
            'date': row['date'],
            'year': year,
            'speaker': speaker,
            'topicId': topic_id,
            'topicKey': t_key,
            'topicLabel': label,
            'isNoise': is_noise,
            'language': language,
            'excerpt': excerpt,
            'searchText': clean[:420],
            'x': round(float(point_x), 4),
            'y': round(float(point_y), 4),
        }
        speech_records.append({k: record[k] for k in ('speechId', 'date', 'year', 'speaker', 'topicId', 'topicKey', 'topicLabel', 'isNoise', 'language', 'excerpt', 'searchText')})
        atlas_points.append({k: record[k] for k in ('speechId', 'year', 'speaker', 'topicId', 'topicKey', 'topicLabel', 'isNoise', 'language', 'excerpt', 'x', 'y')})

        language_totals[language] += 1
        topic_language_totals[t_key][language] += 1
        topic_samples[t_key].append({
            'speechId': speech_id,
            'speaker': speaker,
            'date': row['date'],
            'language': language,
            'excerpt': excerpt,
            'length': len(clean),
        })

    topic_metadata = {}
    for key, label in topic_labels.items():
        year_map = yearly_counts[key]
        total = sum(year_map.values())
        peak_year, peak_count = max(year_map.items(), key=lambda item: item[1])
        keyword_items = keywords['count_with_freq'].get(f'Macro-Topic {key}', [])
        top_keywords = [item['keyword'] for item in keyword_items if not NUMERIC_TOKEN.match(item['keyword'])][:10]
        speaker_items = speaker_counts['top5_speakers_by_topic'].get(f'Macro-Topic {key}', [])
        normalized_speakers = []
        for item in speaker_items:
            normalized_speakers.append({
                'speaker': speaker_norm.get(item['speaker'], item['speaker']),
                'count': int(item['count']),
            })
        sample_speeches = sorted(topic_samples[key], key=lambda sample: sample['length'], reverse=True)[:4]
        topic_metadata[key] = {
            'topicId': int(key),
            'topicKey': key,
            'topicLabel': label,
            'color': topic_colors[key],
            'totalSpeeches': total,
            'peakYear': peak_year,
            'peakCount': peak_count,
            'yearlyCounts': year_map,
            'keywords': top_keywords,
            'topSpeakers': normalized_speakers,
            'languageCounts': dict(topic_language_totals[key]),
            'sampleSpeeches': [{k: value for k, value in sample.items() if k != 'length'} for sample in sample_speeches],
        }

    noise_samples = sorted(topic_samples['noise'], key=lambda sample: sample['length'], reverse=True)[:4]
    topic_metadata['noise'] = {
        'topicId': None,
        'topicKey': 'noise',
        'topicLabel': 'Procedural Noise',
        'color': [148, 163, 184],
        'totalSpeeches': sum(1 for record in speech_records if record['isNoise']),
        'peakYear': None,
        'peakCount': None,
        'yearlyCounts': {},
        'keywords': [],
        'topSpeakers': [],
        'languageCounts': dict(topic_language_totals['noise']),
        'sampleSpeeches': [{k: value for k, value in sample.items() if k != 'length'} for sample in noise_samples],
    }

    topic_companion, event_sources = build_topic_companion(topic_resources, topic_metadata)

    ranked_topics = sorted(
        [item for item in topic_metadata.values() if item['topicId'] is not None],
        key=lambda item: item['totalSpeeches'],
        reverse=True,
    )

    overview_summary = {
        'speechesAnalyzed': len(speech_records),
        'clusteredSpeeches': sum(item['totalSpeeches'] for item in ranked_topics),
        'noiseSpeeches': topic_metadata['noise']['totalSpeeches'],
        'macroTopicCount': len(topic_labels),
        'yearsCovered': [min(record['year'] for record in speech_records), max(record['year'] for record in speech_records)],
        'languages': dict(language_totals),
        'topTopics': [
            {
                'topicId': item['topicId'],
                'topicKey': item['topicKey'],
                'topicLabel': item['topicLabel'],
                'color': item['color'],
                'totalSpeeches': item['totalSpeeches'],
                'peakYear': item['peakYear'],
                'keywords': item['keywords'][:5],
            }
            for item in ranked_topics[:6]
        ],
    }

    speaker_profiles = build_speaker_profiles(
        final_speakers=final_speakers,
        speaker_activity=speaker_activity,
        speech_records=speech_records,
        topic_metadata=topic_metadata,
        curated_profiles=curated_profiles,
        draft_profiles=draft_profiles,
    )

    (TARGET_DATA / 'speech_records.json').write_text(json.dumps(speech_records, ensure_ascii=False), encoding='utf-8')
    (TARGET_DATA / 'atlas_points.json').write_text(json.dumps(atlas_points, ensure_ascii=False), encoding='utf-8')
    (TARGET_DATA / 'topic_metadata.json').write_text(json.dumps(topic_metadata, ensure_ascii=False), encoding='utf-8')
    (TARGET_DATA / 'topic_event_links.json').write_text(json.dumps(topic_companion, ensure_ascii=False), encoding='utf-8')
    (TARGET_DATA / 'event_sources.json').write_text(json.dumps(event_sources, ensure_ascii=False), encoding='utf-8')
    (TARGET_DATA / 'overview_summary.json').write_text(json.dumps(overview_summary, ensure_ascii=False), encoding='utf-8')
    (TARGET_DATA / 'speaker_profiles_enriched.json').write_text(json.dumps(speaker_profiles, ensure_ascii=False), encoding='utf-8')
    print('Wrote speech_records.json, atlas_points.json, topic_metadata.json, topic_event_links.json, event_sources.json, overview_summary.json, speaker_profiles_enriched.json')


if __name__ == '__main__':
    main()
