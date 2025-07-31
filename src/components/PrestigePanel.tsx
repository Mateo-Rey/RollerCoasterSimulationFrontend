import PrestigeUpgradeCard from "./PrestigeUpgradeCard";

interface PrestigePanelProps {
  prestige: number;
  prestigePoints: number;
  balance?: string;
  prestigeRequirement: number;
  prestigeUpgrades: any[];
  currentUpgrades: any;
  onPerformPrestige: () => void;
  onPurchaseUpgrade: (upgradeId: string) => void;
  canPrestige: () => boolean;
  getUpgradeCost: (upgrade: any, currentLevel: number) => number;
}

const PrestigePanel = ({
  prestige,
  prestigePoints,
  balance,
  prestigeRequirement,
  prestigeUpgrades,
  currentUpgrades,
  onPerformPrestige,
  onPurchaseUpgrade,
  canPrestige,
  getUpgradeCost,
}: PrestigePanelProps) => {
  return (
    <div className="p-4">
      <div className="mb-6 p-4 bg-gray-800 rounded">
        <h2 className="text-2xl font-bold mb-4 text-purple-300">
          🌟 Prestige System
        </h2>
        <p className="mb-4 text-gray-300">
          Prestiging resets your park but grants prestige points and increases
          difficulty! Each prestige level makes guests more impatient and
          upgrades more expensive.
        </p>
        <div className="mb-4">
          <div className="text-lg mb-2">
            Progress to Prestige {prestige + 1}: ${Math.round(Number(balance))}{" "}
            / ${Math.floor(prestigeRequirement)}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4">
            <div
              className="bg-purple-600 h-4 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  100,
                  (Number(balance) / prestigeRequirement) * 100
                )}%`,
              }}
            ></div>
          </div>
        </div>
        <button
          onClick={onPerformPrestige}
          disabled={!canPrestige()}
          className={`px-6 py-3 rounded font-bold text-lg ${
            canPrestige()
              ? "bg-purple-600 hover:bg-purple-700 animate-pulse"
              : "bg-gray-600 cursor-not-allowed"
          }`}
        >
          {canPrestige()
            ? `✨ PRESTIGE TO LEVEL ${prestige + 1} ✨`
            : `Need $${Math.floor(prestigeRequirement - Number(balance))} more!`}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prestigeUpgrades.map((upgrade) => (
          <PrestigeUpgradeCard
            key={upgrade.id}
            upgrade={upgrade}
            currentLevel={currentUpgrades[upgrade.id] || 0}
            prestigePoints={prestigePoints}
            onPurchase={onPurchaseUpgrade}
            getUpgradeCost={getUpgradeCost}
          />
        ))}
      </div>
    </div>
  );
};

export default PrestigePanel;