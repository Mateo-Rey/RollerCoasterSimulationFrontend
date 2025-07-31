import { Zone, Guest } from "../schema";
import ZoneCard from "./ZoneCard";

type RideTimer = {
  zoneId: string;
  remaining: number;
};

interface ZoneGridProps {
  zones: Map<string, Zone>;
  guests: Map<string, Guest>;
  guestsByZone: Map<string, Guest[]>;
  selectedZone: string;
  selectedGuests: string[];
  prestigeUnlocks: any[];
  rideTimers: RideTimer[];
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

const ZoneGrid = ({
  zones,
  guests,
  guestsByZone,
  selectedZone,
  selectedGuests,
  prestigeUnlocks,
  rideTimers,
  balance,
  onZoneSelect,
  onSelectedGuestsChange,
  onGuestSelect,
  onAddToRide,
  onStartRide,
  onZoneUpgrade,
  getCost,
  getRemainingTimeForZone,
}: ZoneGridProps) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from(zones.values()).map((zone) => (
        <ZoneCard
          key={zone.zoneId}
          zone={zone}
          guests={guests}
          guestsByZone={guestsByZone}
          selectedZone={selectedZone}
          selectedGuests={selectedGuests}
          prestigeUnlocks={prestigeUnlocks}
          balance={balance}
          onZoneSelect={onZoneSelect}
          onSelectedGuestsChange={onSelectedGuestsChange}
          onGuestSelect={onGuestSelect}
          onAddToRide={onAddToRide}
          onStartRide={onStartRide}
          onZoneUpgrade={onZoneUpgrade}
          getCost={getCost}
          getRemainingTimeForZone={getRemainingTimeForZone}
        />
      ))}
    </div>
  );
};

export default ZoneGrid;