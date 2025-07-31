interface ZoneUpgradesProps {
  zoneId: string;
  balance?: string;
  getCost: (baseCost: number) => number;
  onZoneUpgrade: (zoneId: string, upgradeType: string) => void;
}

const ZoneUpgrades = ({
  zoneId,
  balance,
  getCost,
  onZoneUpgrade,
}: ZoneUpgradesProps) => {
  const upgrades = [
    {
      type: "reduceRideTime",
      cost: 150,
      name: "⏱️ Faster (-2s)",
    },
    {
      type: "increaseQueueCapacity",
      cost: 300,
      name: "➕ Queue Slot",
    },
    {
      type: "increaseRideCapacity",
      cost: 350,
      name: "➕ Ride Slot",
    },
  ];

  return (
    <div className="mt-2 bg-[#1F1F2E] p-2 rounded text-sm">
      <h3 className="font-semibold mb-2">🔧 Zone Upgrades</h3>
      <div className="grid gap-1">
        {upgrades.map((upgrade) => {
          const cost = getCost(upgrade.cost);
          const canAfford = Number(balance) >= cost;
          return (
            <button
              key={upgrade.type}
              onClick={() => canAfford && onZoneUpgrade(zoneId, upgrade.type)}
              className={`p-1 rounded text-xs ${
                canAfford
                  ? "bg-blue-700"
                  : "bg-gray-600 cursor-not-allowed"
              }`}
            >
              {canAfford ? `$${cost}` : `🔒 $${cost}`} {upgrade.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ZoneUpgrades;