interface DifficultyDisplayProps {
  difficulty: any;
  prestige: number;
  getDifficultyColor: (multiplier: number, isPositive?: boolean) => string;
}

const DifficultyDisplay = ({
  difficulty,
  prestige,
  getDifficultyColor,
}: DifficultyDisplayProps) => {
  if (!difficulty.frustrationSpeedMultiplier || prestige === 0) return null;

  return (
    <div className="p-2 bg-red-900 text-sm border-b border-red-700">
      <span className="font-bold text-red-300">
        🔥 DIFFICULTY LEVEL {prestige}:
      </span>
      <span
        className={`ml-2 ${getDifficultyColor(difficulty.frustrationSpeedMultiplier)}`}
      >
        Frustration: {difficulty.frustrationSpeedMultiplier.toFixed(1)}x faster
      </span>{" "}
      |
      <span
        className={`ml-1 ${getDifficultyColor(difficulty.leavingPenaltyMultiplier)}`}
      >
        Leave Penalty: {difficulty.leavingPenaltyMultiplier.toFixed(1)}x
      </span>{" "}
      |
      <span
        className={`ml-1 ${getDifficultyColor(difficulty.upgradeCostMultiplier)}`}
      >
        Upgrade Cost: {difficulty.upgradeCostMultiplier.toFixed(1)}x
      </span>
    </div>
  );
};

export default DifficultyDisplay;