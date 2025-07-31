import { Zone, Guest } from "../schema";

interface GuestListProps {
  zone: Zone;
  guests: Map<string, Guest>;
  guestsByZone: Map<string, Guest[]>;
  selectedGuests: string[];
  onGuestSelect: (guestId: string) => void;
  onAddToRide: () => void;
  onStartRide: () => void;
}

const GuestList = ({
  zone,
  guests,
  guestsByZone,
  selectedGuests,
  onGuestSelect,
  onAddToRide,
  onStartRide,
}: GuestListProps) => {
  const zoneGuests = guestsByZone.get(zone.zoneId) || [];
  const ridingGuests = zoneGuests.filter((g) => g.inRide);
  const queueGuests = zoneGuests.filter((g) => !g.inRide);

  return (
    <div className="mb-2 p-2 bg-[#2A2A40] border-2 border-[#3C3C5C]">
      <div className="mb-4">
        <h2 className="text-lg text-white mb-2">🎢 On Ride</h2>
        {ridingGuests.map((g) => (
          <div
            key={g.id}
            className="text-white bg-[#3B3B5A] py-1 px-2 mb-1"
          >
            Guest {g.id.slice(0, 5)} ({g.type})
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg text-white mb-2">🕓 Queue</h2>
        {queueGuests.map((g) => {
          const isLowPatience = g.timeToFrustration <= 3;
          const isCritical = g.timeToFrustration <= 1;
          const isSelected = selectedGuests.includes(g.id);

          return (
            <div
              key={g.id}
              onClick={() => onGuestSelect(g.id)}
              className={`text-white py-1 px-2 cursor-pointer mb-1 ${
                isSelected
                  ? "bg-green-800"
                  : isCritical
                  ? "bg-red-800 animate-pulse"
                  : isLowPatience
                  ? "bg-orange-700"
                  : "bg-gray-700"
              }`}
            >
              ({g.type}) Guest {g.id.slice(0, 5)} -{" "}
              <span
                className={
                  isCritical
                    ? "text-red-300 font-bold"
                    : isLowPatience
                    ? "text-orange-300"
                    : ""
                }
              >
                {g.timeToFrustration}s
              </span>
              {isCritical && " ⚠️"}
            </div>
          );
        })}
      </div>

      <div className="flex self-center justify-center gap-2 mt-2">
        <button
          className="bg-green-600 hover:bg-green-700 rounded p-2"
          onClick={onAddToRide}
        >
          Add to Ride
        </button>
        {!zone.isRunning && (
          <button
            className="bg-red-700 hover:bg-red-600 rounded p-2"
            onClick={onStartRide}
          >
            Start
          </button>
        )}
      </div>
    </div>
  );
};

export default GuestList;