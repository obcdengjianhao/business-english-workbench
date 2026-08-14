import { useRef, useEffect } from 'react';

export function WordTooltip({ word, wordData, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div className="word-tooltip-overlay" onClick={onClose}>
      <div className="word-tooltip" ref={ref} onClick={(e) => e.stopPropagation()}>
        <button className="word-tooltip-close" onClick={onClose}>
          ×
        </button>
        <h3>{word}</h3>
        {wordData ? (
          <>
            {wordData.phonetic && <p className="word-tooltip-phonetic">/{wordData.phonetic}/</p>}
            <p className="word-tooltip-meaning">{wordData.meaning}</p>
            {wordData.example && (
              <p className="word-tooltip-example">{wordData.example}</p>
            )}
            {wordData.synonyms && (
              <p className="word-tooltip-extra">同义：{wordData.synonyms}</p>
            )}
            {wordData.antonyms && (
              <p className="word-tooltip-extra">反义：{wordData.antonyms}</p>
            )}
          </>
        ) : (
          <p className="word-tooltip-missing">词库中暂未收录该词</p>
        )}
      </div>
    </div>
  );
}
