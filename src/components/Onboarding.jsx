export function Onboarding({ onClose }) {
  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <h2>欢迎使用商务英语词汇工作台</h2>
        <p>这里是你高效记忆商务英语单词的专属空间。</p>
        <ul>
          <li>
            <strong>📚 学习</strong>：从高频到低频，按科学顺序掌握新词。
          </li>
          <li>
            <strong>🔄 复习</strong>：基于艾宾浩斯曲线，在遗忘前及时巩固。
          </li>
          <li>
            <strong>⭐ 单词本</strong>：收藏生疏词，随时重点突破。
          </li>
          <li>
            <strong> 统计</strong>：查看学习进度和掌握度分布。
          </li>
        </ul>
        <p className="tip">小提示：卡片翻转前先主动回忆释义，效果更好。</p>
        <button onClick={onClose}>开始学习</button>
      </div>
    </div>
  );
}
