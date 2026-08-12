import { useState, useMemo, useEffect } from 'react';
import { defaultVocabulary } from './data/vocabulary';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getNextReviewDate, isDueForReview } from './utils/ebinhause';
import './index.css';

const TABS = [
  { key: 'dashboard', label: '概览' },
  { key: 'learn', label: '学习' },
  { key: 'notebook', label: '单词本' },
  { key: 'review', label: '复习' },
  { key: 'list', label: '列表' },
];

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function speak(word) {
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(word);
  utter.lang = 'en-US';
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}

export default function App() {
  const [activeTab, setActiveTab] = useLocalStorage('bew_active_tab', 'dashboard');
  const [progress, setProgress] = useLocalStorage('bew_progress', {});
  const [notebook, setNotebook] = useLocalStorage('bew_notebook', []);
  const [customWords, setCustomWords] = useLocalStorage('bew_custom_words', []);
  const [listFilter, setListFilter] = useLocalStorage('bew_list_filter', 'all');

  const allWords = useMemo(() => {
    const base = [...defaultVocabulary];
    customWords.forEach((cw) => {
      if (!base.find((w) => w.word === cw.word)) {
        base.push(cw);
      }
    });
    return base.sort((a, b) => a.frequency - b.frequency || a.id - b.id);
  }, [customWords]);

  const dueToday = useMemo(() => {
    return allWords.filter((w) => {
      const p = progress[w.word];
      if (!p || !p.learnedAt) return false;
      return isDueForReview(p.nextReviewAt);
    });
  }, [allWords, progress]);

  const masteredWords = useMemo(() => {
    return allWords.filter((w) => {
      const p = progress[w.word];
      return p && p.level >= 4;
    });
  }, [allWords, progress]);

  const learnedWords = useMemo(() => {
    return allWords.filter((w) => {
      const p = progress[w.word];
      return p && p.learnedAt;
    });
  }, [allWords, progress]);

  const stats = useMemo(() => {
    const learned = Object.values(progress).filter((p) => p.learnedAt).length;
    return {
      total: allWords.length,
      learned,
      notebook: notebook.length,
      dueToday: dueToday.length,
      mastered: Object.values(progress).filter((p) => p.level >= 4).length,
    };
  }, [allWords, progress, notebook, dueToday]);

  const markLearned = (word, quality = 'good') => {
    setProgress((prev) => {
      const p = prev[word] || { level: 0 };
      const nextLevel = quality === 'again' ? 0 : Math.min((p.level || 0) + 1, 7);
      return {
        ...prev,
        [word]: {
          ...p,
          level: nextLevel,
          learnedAt: new Date().toISOString(),
          nextReviewAt: getNextReviewDate(nextLevel),
        },
      };
    });
  };

  const addToNotebook = (word) => {
    setNotebook((prev) => {
      if (prev.find((w) => w.word === word.word)) return prev;
      return [...prev, { ...word, addedAt: new Date().toISOString() }];
    });
  };

  const removeFromNotebook = (word) => {
    setNotebook((prev) => prev.filter((w) => w.word !== word.word));
  };

  const addCustomWord = (e) => {
    e.preventDefault();
    const form = e.target;
    const word = form.word.value.trim().toLowerCase();
    const meaning = form.meaning.value.trim();
    const example = form.example.value.trim();
    if (!word || !meaning) return;
    const newWord = {
      id: Date.now(),
      word,
      phonetic: '',
      meaning,
      example: example || '',
      exampleCn: '',
      frequency: 99,
      tags: ['custom'],
    };
    setCustomWords((prev) => [...prev, newWord]);
    form.reset();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>商务英语词汇工作台</h1>
      </header>

      <main className="app-main">
        {activeTab === 'dashboard' && (
          <Dashboard
            stats={stats}
            dueToday={dueToday}
            setTab={setActiveTab}
            setListFilter={setListFilter}
          />
        )}
        {activeTab === 'learn' && (
          <LearnView
            words={allWords}
            progress={progress}
            onLearned={markLearned}
            onAddToNotebook={addToNotebook}
          />
        )}
        {activeTab === 'notebook' && (
          <NotebookView
            notebook={notebook}
            onRemove={removeFromNotebook}
            onAddCustom={addCustomWord}
          />
        )}
        {activeTab === 'review' && (
          <ReviewView
            dueWords={dueToday}
            progress={progress}
            onReview={markLearned}
            onAddToNotebook={addToNotebook}
          />
        )}
        {activeTab === 'list' && (
          <WordListView
            allWords={allWords}
            learnedWords={learnedWords}
            masteredWords={masteredWords}
            dueToday={dueToday}
            listFilter={listFilter}
            setListFilter={setListFilter}
            onAddToNotebook={addToNotebook}
          />
        )}
      </main>

      <nav className="app-nav bottom-nav">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? 'active' : ''}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Dashboard({ stats, dueToday, setTab, setListFilter }) {
  const goToList = (filter) => {
    setListFilter(filter);
    setTab('list');
  };

  return (
    <div className="dashboard">
      <section className="stats-grid">
        <div className="stat-card" onClick={() => goToList('all')}>
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">总词数</span>
        </div>
        <div className="stat-card" onClick={() => goToList('learned')}>
          <span className="stat-number">{stats.learned}</span>
          <span className="stat-label">已学习</span>
        </div>
        <div className="stat-card" onClick={() => goToList('mastered')}>
          <span className="stat-number">{stats.mastered}</span>
          <span className="stat-label">已掌握</span>
        </div>
        <div className="stat-card highlight" onClick={() => goToList('due')}>
          <span className="stat-number">{stats.dueToday}</span>
          <span className="stat-label">今日待复习</span>
        </div>
      </section>

      <section className="quick-actions">
        <h2>今日行动</h2>
        <div className="actions">
          <button onClick={() => setTab('learn')}>开始学习新词</button>
          <button onClick={() => setTab('review')} disabled={dueToday.length === 0}>
            复习今日单词 ({dueToday.length})
          </button>
          <button onClick={() => setTab('notebook')}>查看单词本</button>
        </div>
      </section>

      <section className="tips">
        <h2>学习建议</h2>
        <ul>
          <li>每天先完成「今日待复习」，再学习新词。</li>
          <li>遇到生疏词，随时加入单词本重点突破。</li>
          <li>卡片翻转前先主动回忆释义，效果更好。</li>
        </ul>
      </section>
    </div>
  );
}

function LearnView({ words, progress, onLearned, onAddToNotebook }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const unlearned = useMemo(
    () => words.filter((w) => !progress[w.word]?.learnedAt),
    [words, progress]
  );

  if (unlearned.length === 0) {
    return (
      <div className="empty-state">
        <h2>太棒了！</h2>
        <p>你已经学完了所有内置单词，去「单词本」添加更多吧。</p>
      </div>
    );
  }

  const current = unlearned[index % unlearned.length];

  const handleNext = () => {
    setFlipped(false);
    setIndex((i) => (i + 1) % unlearned.length);
  };

  return (
    <div className="learn-view">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((words.length - unlearned.length) / words.length) * 100}%` }}
        />
      </div>
      <p className="progress-text">
        剩余未学：{unlearned.length} / {words.length}
      </p>

      <div className={`card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
        <div className="card-face card-front">
          <h2>{current.word}</h2>
          <p className="phonetic">{current.phonetic}</p>
          <span className="hint">点击翻转查看释义</span>
        </div>
        <div className="card-face card-back">
          <p className="meaning">{current.meaning}</p>
          <p className="example">{current.example}</p>
          <p className="example-cn">{current.exampleCn}</p>
          <div className="tags">
            {current.tags?.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="card-actions">
        <button onClick={() => speak(current.word)}>🔊 发音</button>
        <button onClick={() => onAddToNotebook(current)}>⭐ 加入单词本</button>
      </div>

      <div className="rating">
        <button
          className="btn-again"
          onClick={() => {
            onLearned(current.word, 'again');
            onAddToNotebook(current);
            handleNext();
          }}
        >
          生疏
        </button>
        <button
          className="btn-good"
          onClick={() => {
            onLearned(current.word, 'good');
            handleNext();
          }}
        >
          掌握
        </button>
      </div>
    </div>
  );
}

function WordListView({
  allWords,
  learnedWords,
  masteredWords,
  dueToday,
  listFilter,
  setListFilter,
  onAddToNotebook,
}) {
  const words = useMemo(() => {
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
      <p className="progress-text">共 {words.length} 个单词</p>
      <ul className="word-list">
        {words.map((w) => (
          <li key={w.word} className="word-list-item">
            <div>
              <strong>{w.word}</strong>
              <span className="phonetic">{w.phonetic}</span>
              <p>{w.meaning}</p>
              {w.example && <p className="example">{w.example}</p>}
            </div>
            <button onClick={() => onAddToNotebook(w)}>⭐</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NotebookView({ notebook, onRemove, onAddCustom }) {
  return (
    <div className="notebook-view">
      <section className="add-word">
        <h2>添加生疏词</h2>
        <form onSubmit={onAddCustom}>
          <input name="word" placeholder="单词" required />
          <input name="meaning" placeholder="释义" required />
          <input name="example" placeholder="例句（可选）" />
          <button type="submit">添加</button>
        </form>
      </section>

      <section className="notebook-list">
        <h2>我的单词本 ({notebook.length})</h2>
        {notebook.length === 0 ? (
          <p className="empty">单词本还是空的，学习时点击「加入单词本」即可添加。</p>
        ) : (
          <ul>
            {notebook.map((w) => (
              <li key={w.word} className="notebook-item">
                <div>
                  <strong>{w.word}</strong>
                  <span className="phonetic">{w.phonetic}</span>
                  <p>{w.meaning}</p>
                  {w.example && <p className="example">{w.example}</p>}
                </div>
                <button onClick={() => onRemove(w)}>移除</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ReviewView({ dueWords, onReview, onAddToNotebook }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (dueWords.length === 0) {
    return (
      <div className="empty-state">
        <h2>今日无复习任务</h2>
        <p>先去学习新词，系统会根据艾宾浩斯曲线安排复习。</p>
      </div>
    );
  }

  const current = dueWords[index % dueWords.length];

  const handleNext = (quality) => {
    onReview(current.word, quality);
    setFlipped(false);
    setIndex((i) => (i + 1) % dueWords.length);
  };

  return (
    <div className="review-view">
      <p className="progress-text">
        今日待复习：{dueWords.length} 个
      </p>
      <div className={`card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
        <div className="card-face card-front">
          <h2>{current.word}</h2>
          <p className="phonetic">{current.phonetic}</p>
          <span className="hint">点击翻转</span>
        </div>
        <div className="card-face card-back">
          <p className="meaning">{current.meaning}</p>
          <p className="example">{current.example}</p>
          <p className="example-cn">{current.exampleCn}</p>
        </div>
      </div>

      <div className="card-actions">
        <button onClick={() => speak(current.word)}>🔊 发音</button>
        <button onClick={() => onAddToNotebook(current)}>⭐ 加入单词本</button>
      </div>

      <div className="rating">
        <button
          className="btn-again"
          onClick={() => {
            onReview(current.word, 'again');
            onAddToNotebook(current);
            setFlipped(false);
            setIndex((i) => (i + 1) % dueWords.length);
          }}
        >
          忘记
        </button>
        <button className="btn-good" onClick={() => handleNext('good')}>
          记得
        </button>
      </div>
    </div>
  );
}
