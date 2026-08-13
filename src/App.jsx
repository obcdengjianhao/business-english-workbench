import { useState, useMemo, useEffect } from 'react';
import { defaultVocabulary } from './data/vocabulary';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getNextReviewDate, isDueForReview } from './utils/ebinhause';
import { WordListView } from './components/WordListView';
import { DataManager } from './components/DataManager';
import { ThemeToggle } from './components/ThemeToggle';
import { StatsView } from './components/StatsView';
import { Onboarding } from './components/Onboarding';
import './index.css';

const TABS = [
  { key: 'dashboard', label: '概览' },
  { key: 'learn', label: '学习' },
  { key: 'notebook', label: '单词本' },
  { key: 'review', label: '复习' },
  { key: 'list', label: '列表' },
  { key: 'settings', label: '设置' },
];

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function speak(word, rate = 0.9) {
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(word);
  utter.lang = 'en-US';
  utter.rate = rate;
  window.speechSynthesis.speak(utter);
}

export default function App() {
  const [activeTab, setActiveTab] = useLocalStorage('bew_active_tab', 'dashboard');
  const [progress, setProgress] = useLocalStorage('bew_progress', {});
  const [notebook, setNotebook] = useLocalStorage('bew_notebook', []);
  const [customWords, setCustomWords] = useLocalStorage('bew_custom_words', []);
  const [listFilter, setListFilter] = useLocalStorage('bew_list_filter', 'all');
  const [darkMode, setDarkMode] = useLocalStorage('bew_dark_mode', false);
  const [autoSpeak, setAutoSpeak] = useLocalStorage('bew_auto_speak', false);
  const [speechRate, setSpeechRate] = useLocalStorage('bew_speech_rate', 0.9);
  const [showOnboarding, setShowOnboarding] = useLocalStorage('bew_onboarding', true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const handleGoTab = (e) => setActiveTab(e.detail);
    window.addEventListener('bew-go-tab', handleGoTab);
    return () => window.removeEventListener('bew-go-tab', handleGoTab);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (showOnboarding) return;
      if (activeTab !== 'learn' && activeTab !== 'review' && activeTab !== 'notebook-learn') return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('bew-flip-card'));
      }
      if (['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('bew-rate-card', { detail: parseInt(e.key, 10) - 1 }));
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeTab, showOnboarding]);

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

  const markLearned = (word, quality = 2) => {
    setProgress((prev) => {
      const p = prev[word] || { level: 0, ease: 2.5 };
      const q = typeof quality === 'string' ? (quality === 'again' ? 0 : 2) : quality;
      const nextLevel = q < 2 ? Math.max(0, (p.level || 0) - 1) : Math.min((p.level || 0) + 1, 12);
      const nextEase = q === 3 ? (p.ease || 2.5) + 0.15 : q === 0 ? Math.max(1.3, (p.ease || 2.5) - 0.2) : (p.ease || 2.5);
      return {
        ...prev,
        [word]: {
          ...p,
          level: nextLevel,
          ease: nextEase,
          learnedAt: new Date().toISOString(),
          nextReviewAt: getNextReviewDate(nextLevel, nextEase, q),
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

  const importData = (data) => {
    if (data.progress) setProgress(data.progress);
    if (data.notebook) setNotebook(data.notebook);
    if (data.customWords) setCustomWords(data.customWords);
  };

  const clearData = () => {
    if (window.confirm('确定要清空所有学习数据吗？此操作不可恢复。')) {
      setProgress({});
      setNotebook([]);
      setCustomWords([]);
    }
  };

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
      <header className="app-header">
        <h1>商务英语词汇工作台</h1>
        <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
      </header>

      <main className="app-main">
        {activeTab === 'dashboard' && (
          <Dashboard
            stats={stats}
            dueToday={dueToday}
            setTab={setActiveTab}
            setListFilter={setListFilter}
            progress={progress}
            allWords={allWords}
          />
        )}
        {activeTab === 'learn' && (
          <LearnView
            words={allWords}
            progress={progress}
            onLearned={markLearned}
            onAddToNotebook={addToNotebook}
            autoSpeak={autoSpeak}
            speechRate={speechRate}
          />
        )}
          {activeTab === 'notebook' && (
            <NotebookView
              notebook={notebook}
              onRemove={removeFromNotebook}
              onAddCustom={addCustomWord}
              onStudyNotebook={() => setActiveTab('notebook-learn')}
            />
          )}
          {activeTab === 'review' && (
            <ReviewView
              dueWords={dueToday}
              progress={progress}
              onReview={markLearned}
              onAddToNotebook={addToNotebook}
              autoSpeak={autoSpeak}
              speechRate={speechRate}
            />
          )}
          {activeTab === 'notebook-learn' && (
            <div>
              <div className="notebook-learn-header">
                <h2>单词本重点学习</h2>
                <button onClick={() => setActiveTab('notebook')}>返回单词本</button>
              </div>
              {notebook.length === 0 ? (
                <div className="empty-state">
                  <h2>单词本还是空的</h2>
                  <p>学习或复习时点击「加入单词本」，把生疏词加进来再重点突破。</p>
                  <button onClick={() => setActiveTab('learn')}>去学习</button>
                </div>
              ) : (
                <LearnView
                  words={notebook}
                  progress={progress}
                  onLearned={markLearned}
                  onAddToNotebook={addToNotebook}
                  autoSpeak={autoSpeak}
                  speechRate={speechRate}
                />
              )}
            </div>
          )}
        {activeTab === 'list' && (
          <WordListView
            allWords={allWords}
            learnedWords={learnedWords}
            masteredWords={masteredWords}
            dueToday={dueToday}
            progress={progress}
            listFilter={listFilter}
            setListFilter={setListFilter}
            onAddToNotebook={addToNotebook}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsView
            progress={progress}
            notebook={notebook}
            customWords={customWords}
            onImport={importData}
            onClear={clearData}
            autoSpeak={autoSpeak}
            setAutoSpeak={setAutoSpeak}
            speechRate={speechRate}
            setSpeechRate={setSpeechRate}
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

function Dashboard({ stats, dueToday, setTab, setListFilter, progress, allWords }) {
  const goToList = (filter) => {
    setListFilter(filter);
    setTab('list');
  };

  const newWordsCount = Math.max(0, stats.total - stats.learned);
  const recommendedReview = Math.min(dueToday.length, 20);
  const recommendedLearn = Math.min(newWordsCount, 10);

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

      <section className="learning-path">
        <h2>今日学习路径</h2>
        <div className="path-steps">
          <div className={`path-step ${dueToday.length > 0 ? 'active' : 'done'}`}>
            <span className="step-number">1</span>
            <div>
              <strong>复习旧词</strong>
              <p>今日待复习 {dueToday.length} 个，建议完成 {recommendedReview} 个</p>
            </div>
            <button onClick={() => setTab('review')} disabled={dueToday.length === 0}>
              去复习
            </button>
          </div>
          <div className={`path-step ${dueToday.length === 0 && newWordsCount > 0 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <div>
              <strong>学习新词</strong>
              <p>剩余未学 {newWordsCount} 个，建议学习 {recommendedLearn} 个</p>
            </div>
            <button onClick={() => setTab('learn')} disabled={newWordsCount === 0}>
              去学习
            </button>
          </div>
          <div className="path-step">
            <span className="step-number">3</span>
            <div>
              <strong>单词本复盘</strong>
              <p>重点突破生疏词汇</p>
            </div>
            <button onClick={() => setTab('notebook')}>去查看</button>
          </div>
        </div>
      </section>

      <section className="quick-actions">
        <h2>快速行动</h2>
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

      <StatsView progress={progress} totalWords={allWords.length} allWords={allWords} />
    </div>
  );
}

function LearnView({ words, progress, onLearned, onAddToNotebook, autoSpeak, speechRate }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const handleFlip = () => setFlipped((f) => !f);
    const handleRate = (e) => {
      const quality = e.detail;
      const btn = document.querySelectorAll('.rating.four button')[quality];
      btn?.click();
    };
    window.addEventListener('bew-flip-card', handleFlip);
    window.addEventListener('bew-rate-card', handleRate);
    return () => {
      window.removeEventListener('bew-flip-card', handleFlip);
      window.removeEventListener('bew-rate-card', handleRate);
    };
  }, []);

  const unlearned = useMemo(
    () => words.filter((w) => !progress[w.word]?.learnedAt),
    [words, progress]
  );

  const learnedCount = words.length - unlearned.length;
  const progressPercent = Math.round((learnedCount / words.length) * 100);

  if (unlearned.length === 0 || showSummary) {
    return (
      <div className="empty-state">
        <h2>太棒了！</h2>
        <p>你已经学完了当前所有单词。</p>
        <p className="progress-text">
          学习进度：{learnedCount}/{words.length} ({progressPercent}%)
        </p>
        <div className="actions">
          <button onClick={() => setShowSummary(false)}>再学一遍</button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('bew-go-tab', { detail: 'review' }))}>
            去复习
          </button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('bew-go-tab', { detail: 'notebook' }))}>
            去单词本
          </button>
        </div>
      </div>
    );
  }

  const current = unlearned[index % unlearned.length];

  const handleNext = () => {
    setFlipped(false);
    setTimeout(() => {
      setIndex((i) => (i + 1) % unlearned.length);
    }, 200);
  };

  const handleSkip = () => {
    setFlipped(false);
    setTimeout(() => {
      setIndex((i) => (i + 1) % unlearned.length);
    }, 200);
  };

  const handleRate = (quality) => {
    const labels = { 0: '已加入单词本', 1: '已加入单词本', 2: '已掌握', 3: '已熟练' };
    const colors = { 0: '#ef4444', 1: '#f59e0b', 2: '#22c55e', 3: '#3b82f6' };
    setFeedback({ text: labels[quality], color: colors[quality] });
    setTimeout(() => setFeedback(null), 800);
    onLearned(current.word, quality);
    if (quality < 2) onAddToNotebook(current);
    setFlipped(false);
    setTimeout(() => {
      setIndex((i) => (i + 1) % unlearned.length);
    }, 200);
  };

  return (
    <div className="learn-view">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${(learnedCount / words.length) * 100}%` }}
        />
      </div>
      <p className="progress-text">
        学习进度：{learnedCount}/{words.length} ({progressPercent}%) · 剩余未学：{unlearned.length}
      </p>

      <div className={`card ${flipped ? 'flipped' : ''}`} onClick={() => {
        setFlipped(!flipped);
        if (!flipped && autoSpeak) speak(current.word, speechRate);
      }}>
        <div className="card-face card-front">
          <h2>{current.word}</h2>
          <p className="phonetic">{current.phonetic}</p>
          <span className="hint">点击翻转查看释义</span>
        </div>
        <div className="card-face card-back">
          <p className="meaning">
            {current.partOfSpeech && <span className="pos">{current.partOfSpeech}</span>}
            {current.meaning}
          </p>
          {current.synonyms && <p className="extra">同义：{current.synonyms}</p>}
          {current.antonyms && <p className="extra">反义：{current.antonyms}</p>}
          <p className="example">{current.example}</p>
          <p className="example-cn">{current.exampleCn}</p>
          <div className="tags">
            {current.tags?.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
            <span className="tag freq">freq {current.frequency}</span>
          </div>
        </div>
      </div>

      <div className="card-actions">
        <button onClick={() => speak(current.word, speechRate)}>🔊 发音</button>
        <button onClick={() => onAddToNotebook(current)}>⭐ 加入单词本</button>
        <button onClick={handleSkip}>⏭ 跳过</button>
      </div>

      {feedback && (
        <div className="feedback-toast" style={{ color: feedback.color }}>
          {feedback.text}
        </div>
      )}

      <div className="rating four">
        <button className="btn-again" onClick={() => handleRate(0)}>
          忘记
        </button>
        <button className="btn-hard" onClick={() => handleRate(1)}>
          模糊
        </button>
        <button className="btn-good" onClick={() => handleRate(2)}>
          记得
        </button>
        <button className="btn-easy" onClick={() => handleRate(3)}>
          熟练
        </button>
      </div>
    </div>
  );
}

function NotebookView({ notebook, onRemove, onAddCustom, onStudyNotebook }) {
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
        <div className="notebook-header">
          <h2>我的单词本 ({notebook.length})</h2>
          {notebook.length > 0 && (
            <button className="study-notebook-btn" onClick={onStudyNotebook}>
              重点学习
            </button>
          )}
        </div>
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

function ReviewView({ dueWords, onReview, onAddToNotebook, autoSpeak, speechRate, progress }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const handleFlip = () => setFlipped((f) => !f);
    const handleRate = (e) => {
      const quality = e.detail;
      const btn = document.querySelectorAll('.rating.four button')[quality];
      btn?.click();
    };
    window.addEventListener('bew-flip-card', handleFlip);
    window.addEventListener('bew-rate-card', handleRate);
    return () => {
      window.removeEventListener('bew-flip-card', handleFlip);
      window.removeEventListener('bew-rate-card', handleRate);
    };
  }, []);

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
    setTimeout(() => {
      setIndex((i) => (i + 1) % dueWords.length);
    }, 200);
  };

  return (
    <div className="review-view">
      <p className="progress-text">今日待复习：{dueWords.length} 个</p>
      <div className={`card ${flipped ? 'flipped' : ''}`} onClick={() => {
        setFlipped(!flipped);
        if (!flipped && autoSpeak) speak(current.word, speechRate);
      }}>
        <div className="card-face card-front">
          <h2>{current.word}</h2>
          <p className="phonetic">{current.phonetic}</p>
          <span className="hint">点击翻转</span>
        </div>
        <div className="card-face card-back">
          <p className="meaning">
            {current.partOfSpeech && <span className="pos">{current.partOfSpeech}</span>}
            {current.meaning}
          </p>
          {current.synonyms && <p className="extra">同义：{current.synonyms}</p>}
          {current.antonyms && <p className="extra">反义：{current.antonyms}</p>}
          <p className="example">{current.example}</p>
          <p className="example-cn">{current.exampleCn}</p>
          <p className="review-date">下次复习：{formatDate(progress[current.word]?.nextReviewAt)}</p>
        </div>
      </div>

      <div className="card-actions">
        <button onClick={() => speak(current.word, speechRate)}>🔊 发音</button>
        <button onClick={() => onAddToNotebook(current)}>⭐ 加入单词本</button>
      </div>

      <div className="rating four">
        <button
          className="btn-again"
          onClick={() => {
            onReview(current.word, 0);
            onAddToNotebook(current);
            setFlipped(false);
            setTimeout(() => {
              setIndex((i) => (i + 1) % dueWords.length);
            }, 200);
          }}
        >
          忘记
        </button>
        <button
          className="btn-hard"
          onClick={() => {
            onReview(current.word, 1);
            onAddToNotebook(current);
            setFlipped(false);
            setTimeout(() => {
              setIndex((i) => (i + 1) % dueWords.length);
            }, 200);
          }}
        >
          模糊
        </button>
        <button
          className="btn-good"
          onClick={() => {
            onReview(current.word, 2);
            setFlipped(false);
            setTimeout(() => {
              setIndex((i) => (i + 1) % dueWords.length);
            }, 200);
          }}
        >
          记得
        </button>
        <button
          className="btn-easy"
          onClick={() => {
            onReview(current.word, 3);
            setFlipped(false);
            setTimeout(() => {
              setIndex((i) => (i + 1) % dueWords.length);
            }, 200);
          }}
        >
          熟练
        </button>
      </div>
    </div>
  );
}

function SettingsView({
  progress,
  notebook,
  customWords,
  onImport,
  onClear,
  autoSpeak,
  setAutoSpeak,
  speechRate,
  setSpeechRate,
}) {
  return (
    <div className="settings-view">
      <h2>设置</h2>

      <section className="setting-section">
        <h3>发音设置</h3>
        <label className="setting-row">
          <input
            type="checkbox"
            checked={autoSpeak}
            onChange={(e) => setAutoSpeak(e.target.checked)}
          />
          <span>卡片翻转时自动发音</span>
        </label>
        <label className="setting-row">
          <span>语速：{speechRate.toFixed(1)}</span>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
          />
        </label>
      </section>

      <DataManager progress={progress} notebook={notebook} customWords={customWords} onImport={onImport} onClear={onClear} />
    </div>
  );
}
