import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np

REPO_ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = REPO_ROOT.parent / 'lk-hansard-topic-modeling' / 'artifacts' / 'final_v14'
TARGET_DATA = REPO_ROOT / 'public' / 'data'

TEMPORAL_PATH = TARGET_DATA / 'macro_topic_temporal_evolution_chart_data.json'
KEYWORDS_PATH = TARGET_DATA / 'macro_topic_keywords_100.json'
SPEAKER_COUNTS_PATH = TARGET_DATA / 'speaker_topic_counts_by_macro_topic.json'
SPEAKER_NORMALIZATION_PATH = TARGET_DATA / 'speaker_normalization.json'

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


def main() -> None:
    TARGET_DATA.mkdir(parents=True, exist_ok=True)

    temporal = load_json(TEMPORAL_PATH)
    keywords = load_json(KEYWORDS_PATH)
    speaker_counts = load_json(SPEAKER_COUNTS_PATH)
    speaker_norm = load_json(SPEAKER_NORMALIZATION_PATH)

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

    (TARGET_DATA / 'speech_records.json').write_text(json.dumps(speech_records, ensure_ascii=False), encoding='utf-8')
    (TARGET_DATA / 'atlas_points.json').write_text(json.dumps(atlas_points, ensure_ascii=False), encoding='utf-8')
    (TARGET_DATA / 'topic_metadata.json').write_text(json.dumps(topic_metadata, ensure_ascii=False), encoding='utf-8')
    (TARGET_DATA / 'overview_summary.json').write_text(json.dumps(overview_summary, ensure_ascii=False), encoding='utf-8')
    print('Wrote speech_records.json, atlas_points.json, topic_metadata.json, overview_summary.json')


if __name__ == '__main__':
    main()
