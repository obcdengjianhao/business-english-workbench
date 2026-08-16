import { useState, useMemo } from 'react';
import { WordTooltip } from './WordTooltip';

function normalizeWord(word) {
  return word.toLowerCase().replace(/[^a-z]/g, '');
}

export function ClickableExample({ example, exampleCn, allWords, onAddToNotebook }) {
  const [selected, setSelected] = useState(null);

  const wordMap = useMemo(() => {
    const map = {};
    allWords.forEach((w) => {
      map[normalizeWord(w.word)] = w;
    });
    return map;
  }, [allWords]);

  const tokens = useMemo(() => {
    if (!example) return [];
    return example.split(/(\s+)/).map((token, index) => ({
      text: token,
      key: `${token}-${index}`,
      isWord: /^[a-zA-Z]+$/.test(token),
    }));
  }, [example]);

  const selectedWord = selected ? wordMap[normalizeWord(selected)] : null;

  const cnTokens = useMemo(() => {
    if (!exampleCn) return [];
    return exampleCn.split(/([\u4e00-\u9fa5]+)/).map((token, index) => ({
      text: token,
      key: `${token}-${index}`,
      isChinese: /[\u4e00-\u9fa5]/.test(token),
    }));
  }, [exampleCn]);

  return (
    <>
      <p className="example">
        {tokens.map((token) =>
          token.isWord ? (
            <span
              key={token.key}
              className="example-word"
              onClick={(e) => {
                e.stopPropagation();
                setSelected(token.text);
              }}
            >
              {token.text}
            </span>
          ) : (
            <span key={token.key}>{token.text}</span>
          )
        )}
      </p>
      {exampleCn && (
        <p className="example-cn">
          {cnTokens.map((token) =>
            token.isChinese ? (
              <span
                key={token.key}
                className="example-word-cn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(token.text);
                }}
              >
                {token.text}
              </span>
            ) : (
              <span key={token.key}>{token.text}</span>
            )
          )}
        </p>
      )}
      {selected && (
        <WordTooltip
          word={selected}
          wordData={selectedWord}
          onClose={() => setSelected(null)}
          onAddToNotebook={onAddToNotebook}
        />
      )}
    </>
  );
}
