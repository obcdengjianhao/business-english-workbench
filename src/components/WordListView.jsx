import { useState, useMemo } from 'react';

const SORT_OPTIONS = [
  { key: 'frequency-asc', label: '频率从低到高' },
  { key: 'frequency-desc', label: '频率从高到低' },
  { key: 'alpha-asc', label: 'A-Z' },
  { key: 'alpha-desc', label: 'Z-A' },
];

export function WordListView({
  allWords,
  learnedWords,
  masteredWords,
  dueToday,
  progress,
  listFilter,
  setListFilter,
  onAddToNotebook,
}) {
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [freqRange, setFreqRange] = useState('all');
  const [sort, setSort] = useState('frequency-asc');

  const allTags = useMemo(() => {
    const set = new Set();
    allWords.forEach((w) => w.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [allWords]);

  const baseWords = useMemo(() => {
    switch (listFilter) {
      case 'learned':
        return learnedWords;
      case 'mastered':
        return masteredWords;
      case 'due':
        return dueToday;
      default:
        return allWords;
    }
  }, [allWords, learnedWords, masteredWords, dueToday, listFilter]);

  const filtered = useMemo(() => {
    let result = baseWords;

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (w) =>
          w.word.toLowerCase().includes(q) ||
          w.meaning.toLowerCase().includes(q) ||
          w.phonetic.toLowerCase().includes(q)
      );
    }

    if (tagFilter) {
      result = result.filter((w) => w.tags?.includes(tagFilter));
    }

    if (freqRange !== 'all') {
      const [min, max] = freqRange.split('-').map(Number);
      result = result.filter((w) => w.frequency >= min && w.frequency <= max);
    }

    result = [...result];
    switch (sort) {
      case 'frequency-asc':
        result.sort((a, b) => a.frequency - b.frequency || a.id - b.id);
        break;
      case 'frequency-desc':
        result.sort((a, b) => b.frequency - a.frequency || a.id - b.id);
        break;
      case 'alpha-asc':
        result.sort((a, b) => a.word.localeCompare(b.word));
        break;
      case 'alpha-desc':
        result.sort((a, b) => b.word.localeCompare(a.word));
        break;
      default:
        break;
    }

    return result;
  }, [baseWords, search, tagFilter, freqRange, sort]);

  const titles = {
    all: '全部单词',
    learned: '已学习单词',
    mastered: '已掌握单词',
    due: '今日待复习',
  };

  return (
    <div className="word-list-view">
      <h2>{titles[listFilter] || '单词列表'}</h2>

      <div className="list-filters">
        <button className={listFilter === 'all' ? 'active' : ''} onClick={() => setListFilter('all')}>
          全部
        </button>
        <button className={listFilter === 'learned' ? 'active' : ''} onClick={() => setListFilter('learned')}>
          已学习
        </button>
        <button className={listFilter === 'mastered' ? 'active' : ''} onClick={() => setListFilter('mastered')}>
          已掌握
        </button>
        <button className={listFilter === 'due' ? 'active' : ''} onClick={() => setListFilter('due')}>
          待复习
        </button>
      </div>

      <div className="list-controls">
        <input
          type="text"
          placeholder="搜索单词、释义、音标"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          <option value="">所有标签</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={freqRange} onChange={(e) => setFreqRange(e.target.value)}>
          <option value="all">所有频率</option>
          <option value="1-5">高频核心 (1-5)</option>
          <option value="6-11">中频 (6-11)</option>
          <option value="12-16">中低频 (12-16)</option>
          <option value="17-99">低频/自定义 (17+)</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <p className="progress-text">
        共 {filtered.length} 个单词
        {search && `（搜索 "${search}"）`}
      </p>

      <ul className="word-list">
        {filtered.map((w) => {
          const p = progress[w.word];
          return (
            <li key={`${w.id}-${w.word}`} className="word-list-item">
              <div className="word-info">
                <div className="word-title">
                  <strong>{w.word}</strong>
                  <span className="phonetic">{w.phonetic}</span>
                  {p?.nextReviewAt && (
                    <span className="review-date">下次复习: {formatDate(p.nextReviewAt)}</span>
                  )}
                </div>
                <p>{w.meaning}</p>
                {w.example && <p className="example">{w.example}</p>}
                <div className="tags">
                  {w.tags?.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={() => onAddToNotebook(w)} title="加入单词本">
                ⭐
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
