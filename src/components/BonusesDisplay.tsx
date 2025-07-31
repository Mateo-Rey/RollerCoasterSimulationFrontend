interface BonusesDisplayProps {
  bonuses: any;
  prestigeUnlocks: any[];
}

const BonusesDisplay = ({ bonuses, prestigeUnlocks }: BonusesDisplayProps) => {
  if (!bonuses.moneyMultiplier) return null;

  return (
    <div className="p-2 bg-gray-800 text-sm">
      💰 Money: {bonuses.moneyMultiplier.toFixed(1)}x | ⏱️ Patience: +
      {bonuses.guestPatienceBonus || 0}s | 💸 Discount:{" "}
      {((bonuses.upgradeDiscount || 0) * 100).toFixed(0)}% | 🏆 Prestige
      Unlocks: {prestigeUnlocks.join(", ") || "None"}
    </div>
  );
};

export default BonusesDisplay;