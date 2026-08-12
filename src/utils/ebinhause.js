// 基于 SM-2 的复习间隔算法
// quality: 0=忘记, 1=模糊, 2=记得, 3=熟练

const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;

export function getNextReviewDate(level, ease = DEFAULT_EASE, quality = 2) {
  let nextEase = ease;
  let nextLevel = level || 0;

  if (quality < 2) {
    nextEase = Math.max(MIN_EASE, ease - 0.2);
    nextLevel = Math.max(0, nextLevel - 1);
  } else if (quality === 3) {
    nextEase = ease + 0.15;
  }

  let interval;
  if (quality === 0) {
    interval = 1 / (24 * 60); // 10分钟后
  } else if (nextLevel === 0) {
    interval = 1;
  } else if (nextLevel === 1) {
    interval = 6 / 24;
  } else {
    const prevInterval = getIntervalForLevel(nextLevel - 1, nextEase);
    interval = prevInterval * nextEase;
  }

  const date = new Date();
  date.setTime(date.getTime() + interval * 24 * 60 * 60 * 1000);
  return date.toISOString();
}

function getIntervalForLevel(level, ease) {
  if (level <= 0) return 1 / (24 * 6); // 10分钟
  if (level === 1) return 1;
  let interval = 1;
  for (let i = 2; i <= level; i++) {
    interval *= ease;
  }
  return interval;
}

export function isDueForReview(nextReviewAt) {
  if (!nextReviewAt) return true;
  return new Date(nextReviewAt) <= new Date();
}

export const QUALITY_LABELS = {
  0: '忘记',
  1: '模糊',
  2: '记得',
  3: '熟练',
};
