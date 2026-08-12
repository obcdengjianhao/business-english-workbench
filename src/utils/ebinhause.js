// 艾宾浩斯复习间隔（分钟 -> 天）
export const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30, 60, 90];

export function getNextReviewDate(level = 0) {
  const days = REVIEW_INTERVALS[Math.min(level, REVIEW_INTERVALS.length - 1)];
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function isDueForReview(nextReviewAt) {
  if (!nextReviewAt) return true;
  return new Date(nextReviewAt) <= new Date();
}
