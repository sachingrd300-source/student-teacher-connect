
export const REWARD_LEVELS = [
  { level: 1, name: "Bronze", days: 7, rewards: [5, 10, 15, 20, 25, 30, 50] },
  { level: 2, name: "Silver", days: 7, rewards: [10, 15, 20, 25, 30, 40, 75] },
  { level: 3, name: "Gold", days: 7, rewards: [15, 20, 25, 30, 40, 50, 100] },
  { level: 4, name: "Platinum", days: 14, rewards: [20, 25, 30, 35, 40, 45, 50, 25, 30, 35, 40, 45, 50, 150] },
];

/**
 * Gets the current level and progress within that level based on a total streak.
 * @param totalStreak The total number of consecutive days logged in.
 * @returns An object with the current level's configuration and the user's progress.
 */
export const getLevelInfo = (totalStreak: number) => {
  let cumulativeDays = 0;
  for (const levelConfig of REWARD_LEVELS) {
    // If the total streak falls within the range of the current level
    if (totalStreak <= cumulativeDays + levelConfig.days) {
      return {
        ...levelConfig,
        dayInLevel: totalStreak - cumulativeDays,
        isFinalLevel: false,
        totalDaysInLevel: levelConfig.days,
      };
    }
    cumulativeDays += levelConfig.days;
  }

  // If streak exceeds all defined levels, cycle within the last level.
  const lastLevel = REWARD_LEVELS[REWARD_LEVELS.length - 1];
  // Calculate how many days into the last level's cycle the user is.
  const daysIntoLastLevel = (totalStreak - cumulativeDays - 1) % lastLevel.days;
  
  return {
    ...lastLevel,
    dayInLevel: daysIntoLastLevel + 1,
    isFinalLevel: true,
    totalDaysInLevel: lastLevel.days,
  };
};
