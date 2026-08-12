import { useState } from 'react';

export function DataManager({ progress, notebook, customWords, onImport, onClear }) {
  const [message, setMessage] = useState('');

  const exportData = () => {
    const data = {
      progress,
      notebook,
      customWords,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-english-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('数据已导出');
    setTimeout(() => setMessage(''), 2000);
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        onImport(data);
        setMessage('数据导入成功');
      } catch (err) {
        setMessage('导入失败：文件格式错误');
      }
      setTimeout(() => setMessage(''), 2000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="data-manager">
      <h2>数据管理</h2>
      <div className="data-actions">
        <button onClick={exportData}>导出学习数据</button>
        <label className="import-label">
          导入学习数据
          <input type="file" accept="application/json" onChange={importData} />
        </label>
        <button className="danger" onClick={onClear}>
          清空所有数据
        </button>
      </div>
      {message && <p className="data-message">{message}</p>}
    </div>
  );
}
