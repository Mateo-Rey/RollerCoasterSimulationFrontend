import { useState, useEffect, useRef, useMemo } from "react";
import { Zone, Guest } from "./schema";
import "./App.css";

type RideTimer = {
  zoneId: string;
  remaining: number; // seconds remaining
};

function App() {
  const [zones, setZones] = useState<Map<string, Zone>>(new Map());
  const [guests, setGuests] = useState<Map<string, Guest>>(new Map());
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [rideTimers, setRideTimers] = useState<RideTimer[]>([]);
  const ws = useRef<WebSocket | null>(null);

  // Cleanup selectedGuests if guest is removed
  useEffect(() => {
    setSelectedGuests((prevSelected) =>
      prevSelected.filter((guestId) => guests.has(guestId))
    );
  }, [guests]);

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8080");

    ws.current.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.current.onmessage = (event) => {
      const parsed = JSON.parse(event.data);

      if (parsed.eventType === "parkData") {
        setZones(new Map(Object.entries(parsed.data.zones)));
        setGuests(new Map(Object.entries(parsed.data.guests)));
      } else if (parsed.eventType === "rideRunning") {
        // parsed.data is a JSON string with { zoneId: string, durationSeconds: number }
        // Adjust this parsing if the format is different
        const rideInfo = parsed.data;
        const { zoneId, durationSeconds } = rideInfo;

        setRideTimers((prev) => {
          // Remove existing timer for zone if any
          const filtered = prev.filter((t) => t.zoneId !== zoneId);
          return [...filtered, { zoneId, remaining: durationSeconds }];
        });
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  // Countdown timers for all rides
  useEffect(() => {
    if (rideTimers.length === 0) return;

    const interval = setInterval(() => {
      setRideTimers((prevTimers) => {
        const updated: RideTimer[] = [];

        for (const timer of prevTimers) {
          const newRemaining = timer.remaining - 1;

          if (newRemaining <= 0) {
            // Timer expired → notify backend ride ended
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
              ws.current.send(
                JSON.stringify({
                  eventType: "rideEnded",
                  eventTimestamp: Date.now(),
                  source: "REACT_UI",
                  data: timer.zoneId,
                })
              );
            }
          } else {
            updated.push({ ...timer, remaining: newRemaining });
          }
        }

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [rideTimers]);
  // Helpers
  const guestsArray = useMemo(() => Array.from(guests.values()), [guests]);
  const guestsByZone = useMemo(() => {
    const map = new Map<string, Guest[]>();
    for (const guest of guestsArray) {
      if (!map.has(guest.zoneId)) map.set(guest.zoneId, []);
      map.get(guest.zoneId)!.push(guest);
    }
    return map;
  }, [guestsArray]);

  const addSelectedGuest = (id: string) => {
    setSelectedGuests((prev) =>
      prev.includes(id)
        ? prev.filter((guestId) => guestId !== id)
        : [...prev, id]
    );
  };

  const addToRide = () => {
    if (ws.current) {
      const uniqueGuests = selectedGuests.filter((guestId) =>
        guests.has(guestId)
      );
      ws.current.send(
        JSON.stringify({
          eventType: "addToRide",
          eventTimestamp: Date.now(),
          source: "REACT_UI",
          data: uniqueGuests,
        })
      );
    }
    setSelectedGuests([]);
  };

  const startRide = () => {
    const z = zones.get(selectedZone);
    if (!z) return;
    if (
      ws.current &&
      !rideTimers.find((t) => t.zoneId === selectedZone) &&
      z.rideCount > 0
    ) {
      ws.current.send(
        JSON.stringify({
          eventType: "startRide",
          eventTimestamp: Date.now(),
          source: "REACT_UI",
          data: selectedZone,
        })
      );
    }
  };

  // Helper to get remaining time for a zone
  const getRemainingTimeForZone = (zoneId: string) => {
    const timer = rideTimers.find((t) => t.zoneId === zoneId);
    return timer ? timer.remaining : 0;
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {Array.from(zones.values()).map((zone) => (
          <div key={zone.zoneId}>
            <div
              className={`bg-[rgb(10,10,10)] m-4 p-4 flex flex-col rounded-lg cursor-pointer ${
                selectedZone === zone.zoneId ? "bg-green-800" : ""
              }`}
              onClick={() => {
                if (selectedZone !== zone.zoneId) {
                  setSelectedZone(zone.zoneId);
                  setSelectedGuests([]);
                }
              }}
            >
              <h1>{zone.zoneName}</h1>
              <p>
                {((zone.queueCount / zone.queueCapacity) * 100).toFixed(0)}%
              </p>
              {/* Show ride timer if running */}
              {getRemainingTimeForZone(zone.zoneId) > 0 && (
                <p className="text-yellow-400 font-bold">
                  Ride Running: {getRemainingTimeForZone(zone.zoneId)} sec
                </p>
              )}
            </div>

            {selectedZone === zone.zoneId && (
              <div className="mb-2 p-2 bg-[#2A2A40] border-2 border-[#3C3C5C]">
                {!zone.isRunning && (
                  <button onClick={startRide}>Start Ride</button>
                )}

                {/* Guests in Ride */}
                <div className="mb-4">
                  <h2 className="text-lg text-white mb-2">🎢 On the Ride</h2>
                  {(guestsByZone.get(zone.zoneId) || [])
                    .filter((g) => g.inRide)
                    .map((g) => (
                      <div
                        key={g.id}
                        className="text-white bg-[#3B3B5A] py-1 px-2 border-2 border-[#646496] mb-2"
                      >
                        <h3>Guest {g.id.slice(0, 5)}</h3>
                      </div>
                    ))}
                </div>

                {/* Guests in Queue */}
                <div>
                  <h2 className="text-lg text-white mb-2">🕓 In Queue</h2>
                  {(guestsByZone.get(zone.zoneId) || [])
                    .filter((g) => !g.inRide)
                    .map((g) => (
                      <div
                        key={g.id}
                        onClick={() => addSelectedGuest(g.id)}
                        className={`text-white py-1 px-2 cursor-pointer border-2 border-[#B0B3C7] mb-2 ${
                          selectedGuests.includes(g.id) ? "bg-green-800" : ""
                        }`}
                      >
                        <h3 className="text-md">Guest {g.id.slice(0, 5)}</h3>
                        <p>
                          Frustration in:{" "}
                          {Math.max(
                            0,
                            Math.round(
                              (g.timeToFrustration - Date.now()) / 1000
                            )
                          )}{" "}
                          sec
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addToRide}
        className="m-4 p-2 bg-blue-600 text-white rounded"
      >
        {selectedGuests.length > 1 ? "Add Guests To Ride" : "Add Guest To Ride"}
      </button>
    </>
  );
}

export default App;
