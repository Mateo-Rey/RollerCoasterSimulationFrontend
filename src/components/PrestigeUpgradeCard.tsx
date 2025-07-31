interface PrestigeUpgradeCardProps {
  upgrade: any;
  currentLevel: number;
  prestigePoints: number;
  onPurchase: (upgradeId: string) => void;
  getUpgradeCost: (upgrade: any, currentLevel: number) => number;
}

const PrestigeUpgradeCard = ({
  upgrade,
  currentLevel,
  prestigePoints,
  onPurchase,
  getUpgradeCost,
}: PrestigeUpgradeCardProps) => {
  const cost = getUpgradeCost(upgrade, currentLevel);
  const canAfford = prestigePoints >= cost && currentLevel < upgrade.maxLevel;
  const isMaxed = currentLevel >= upgrade.maxLevel;

  return (
    <div className="bg-gray-800 p-4 rounded border-2 border-gray-700">
      <h3 className="font-bold text-purple-300 mb-1">{upgrade.name}</h3>
      <p className="text-sm text-gray-300 mb-3">{upgrade.description}</p>
      <div className="text-sm mb-2 text-gray-400">
        Level {currentLevel}/{upgrade.maxLevel}
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
        <div
          className="bg-purple-500 h-2 rounded-full"
          style={{
            width: `${(currentLevel / upgrade.maxLevel) * 100}%`,
          }}
        ></div>
      </div>
      <button
        onClick={() => canAfford && onPurchase(upgrade.id)}
        disabled={!canAfford || isMaxed}
        className={`w-full py-2 rounded font-semibold ${
          isMaxed
            ? "bg-yellow-600 text-yellow-100"
            : canAfford
            ? "bg-purple-600 hover:bg-purple-700 text-white"
            : "bg-gray-600 cursor-not-allowed text-gray-400"
        }`}
      >
        {isMaxed ? "✅ MAXED" : `Upgrade (${cost} pts)`}
      </button>
    </div>
  );
};

export default PrestigeUpgradeCard;