interface GlobalUpgradesProps {
  balance?: string;
  getCost: (baseCost: number) => number;
  onApplyUpgrade: (upgradeType: string) => void;
}

const GlobalUpgrades = ({
  balance,
  getCost,
  onApplyUpgrade,
}: GlobalUpgradesProps) => {
  const upgrades = [
    {
      type: "moneyMultiplier",
      cost: 500,
      name: "💰 Money Multiplier (+0.2x)",
    },
    {
      type: "extendGuestTimersTemporary",
      cost: 250,
      name: "⌛ +10s Guest Patience",
    },
    {
      type: "freezeGuestTimers",
      cost: 100,
      name: "🧘‍♂️ Freeze Timers (5s)",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
      {upgrades.map((upgrade) => {
        const cost = getCost(upgrade.cost);
        const canAfford = Number(balance) >= cost;
        return (
          <button
            key={upgrade.type}
            onClick={() => canAfford && onApplyUpgrade(upgrade.type)}
            className={`p-2 rounded ${
              canAfford
                ? "bg-purple-700 hover:bg-purple-800"
                : "bg-gray-600 cursor-not-allowed"
            }`}
          >
            {canAfford ? `$${cost}` : `🔒 $${cost}`} {upgrade.name}
          </button>
        );
      })}
    </div>
  );
};

export default GlobalUpgrades;