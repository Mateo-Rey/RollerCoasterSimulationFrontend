import { Zone, Guest } from "../schema";
import ZoneUpgrades from "./ZoneUpgrades";
import GuestList from "./GuestList";

interface ZoneCardProps {
  zone: Zone;
  guests: Map<string, Guest>;
  guestsByZone: Map<string, Guest[]>;
  selectedZone: string;
  selectedGuests: string[];
  prestigeUnlocks: any[];
  balance?: string;
  onZoneSelect: (zoneId: string) => void;
  onSelectedGuestsChange: (guests: string[]) => void;
  onGuestSelect: (guestId: string) => void;
  onAddToRide: () => void;
  onStartRide: () => void;
  onZoneUpgrade: (zoneId: string, upgradeType: string) => void;
  getCost: (baseCost: number) => number;
  getRemainingTimeForZone: (zoneId: string) => number;
}

const ZoneCard = ({
  zone,
  guests,
  guestsByZone,
  selectedZone,
  selectedGuests,
  prestigeUnlocks,
  balance,
  onZoneSelect,
  onSelectedGuestsChange,
  onGuestSelect,
  onAddToRide,
  onStartRide,
  onZoneUpgrade,
  getCost,
  getRemainingTimeForZone,
}: ZoneCardProps) => {
  const isLocked = zone.zoneId === "3" && !prestigeUnlocks.includes("newZone");
  const isSelected = selectedZone === zone.zoneId;
  const remainingTime = getRemainingTimeForZone(zone.zoneId);

  const handleZoneClick = () => {
    if (selectedZone !== zone.zoneId) {
      onZoneSelect(zone.zoneId);
      onSelectedGuestsChange([]);
    }
  };

  return (
    <div className="flex flex-col">
      <div
        className={`${
          isLocked && "z-1 blur-lg pointer-events-none"
        }`}
      >
        <div
          className={`bg-[rgb(10,10,10)] m-4 p-4 flex flex-col rounded-lg cursor-pointer ${
            isSelected ? "bg-green-800" : ""
          }`}
          onClick={handleZoneClick}
        >
          <h1>{zone.zoneName}</h1>
          <p>
            Queue: {zone.queueCount}/{zone.queueCapacity}
          </p>
          <p>
            Ride: {zone.rideCount}/{zone.rideCapacity}
          </p>
          <p>Time: {zone.rideTime}s</p>

          <ZoneUpgrades
            zoneId={zone.zoneId}
            balance={balance}
            getCost={getCost}
            onZoneUpgrade={onZoneUpgrade}
          />

          {remainingTime > 0 && (
            <p className="text-yellow-400 font-bold mt-2">
              Running: {remainingTime}s
            </p>
          )}
        </div>

        {isSelected && (
          <GuestList
            zone={zone}
            guests={guests}
            guestsByZone={guestsByZone}
            selectedGuests={selectedGuests}
            onGuestSelect={onGuestSelect}
            onAddToRide={onAddToRide}
            onStartRide={onStartRide}
          />
        )}
      </div>
      {isLocked && (
        <h2 className="text-xl font-bold text-amber-600">
          Unlocked at Prestige 9
        </h2>
      )}
    </div>
  );
};

export default ZoneCard;