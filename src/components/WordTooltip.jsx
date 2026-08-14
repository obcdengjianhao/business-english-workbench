import { useState, useRef, useEffect } from 'react';

export function WordTooltip({ word, meaning, onClose }) {
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
    <div className="word-tooltip-overlay">
      <div className="word-tooltip" ref={ref}>
        <button className="word-tooltip-close" onClick={onClose}>
          ×
        </button>
        <h3>{word}</h3>
        {meaning ? (
          <>
            <p className="word-tooltip-meaning">{meaning}</p>
          </>
        ) : (
          <p className="word-tooltip-missing">词库中暂未收录该词</p>
        )}
      </div>
    </div>
  );
}
