import { useState, useEffect, useRef, useMemo } from "react";
import { Zone, Guest } from "./schema";
import "./App.css";

type RideTimer = {
  zoneId: string;
  remaining: number;
};

function App() {
  const [zones, setZones] = useState<Map<string, Zone>>(new Map());
  const [guests, setGuests] = useState<Map<string, Guest>>(new Map());
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [rideTimers, setRideTimers] = useState<RideTimer[]>([]);
  const [balance, setBalance] = useState<string>();
  const [gameOver, setGameOver] = useState(false);
  const pausedRef = useRef(false);

  // Prestige state
  const [prestige, setPrestige] = useState(0);
  const [prestigePoints, setPrestigePoints] = useState(0);
  const [bonuses, setBonuses] = useState<any>({});
  const [difficulty, setDifficulty] = useState<any>({});
  const [prestigeUpgrades, setPrestigeUpgrades] = useState<any[]>([]);
  const [currentUpgrades, setCurrentUpgrades] = useState<any>({});
  const [prestigeUnlocks, setPrestigeUnlocks] = useState<any>([]);
  const [prestigeRequirement, setPrestigeRequirement] = useState<number>(10);
  const [activeTab, setActiveTab] = useState<"park" | "prestige">("park");
  const [notifications, setNotifications] = useState<string[]>([]);
  const [autoStartNum, setAutoStartNum] = useState<number>(5);
  console.log(prestigeUnlocks)
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    setSelectedGuests((prevSelected) =>
      prevSelected.filter((guestId) => guests.has(guestId))
    );
  }, [guests]);

  const addNotification = (message: string) => {
    setNotifications((prev) => [...prev, message]);
    setTimeout(() => {
      setNotifications((prev) => prev.slice(1));
    }, 3000);
  };

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8080");

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      ws.current?.send(
        JSON.stringify({
          EventType: "identify",
          EventTimestamp: Date.now(),
          Source: { ClientType: "REACT_UI" },
          Data: { client: "react" },
        })
      );
    };

    ws.current.onmessage = (event) => {
      const parsed = JSON.parse(event.data);

      if (parsed.EventType === "parkData") {
        setZones(new Map(Object.entries(parsed.Data.zones)));
        setGuests(new Map(Object.entries(parsed.Data.guests)));
        setBalance(parsed.Data.balance);
        setPrestige(parsed.Data.prestige || 0);
        setPrestigePoints(parsed.Data.prestigePoints || 0);
        if (parsed.Data.bonuses) setBonuses(parsed.Data.bonuses);
        if (parsed.Data.difficulty) setDifficulty(parsed.Data.difficulty);
        if (parsed.Data.prestigeRequirement !== undefined) {
          setPrestigeRequirement(parsed.Data.prestigeRequirement);
        }
      } else if (parsed.EventType === "prestigeSystemData") {
        setPrestigeUpgrades(parsed.Data.prestigeUpgrades || []);
        setCurrentUpgrades(parsed.Data.currentUpgrades || {});
        setPrestigePoints(parsed.Data.prestigePoints || 0);
        if (parsed.Data.bonuses) setBonuses(parsed.Data.bonuses);
        if (parsed.Data.difficulty) setDifficulty(parsed.Data.difficulty);
        if (parsed.Data.prestigeRequirement) {
          setPrestigeRequirement(parsed.Data.prestigeRequirement);
        }
      } else if (parsed.EventType === "prestigeUpgradePurchased") {
        setCurrentUpgrades((prev) => ({
          ...prev,
          [parsed.Data.upgradeId]: parsed.Data.newLevel,
        }));
        setPrestigePoints(parsed.Data.prestigePoints);
        if (parsed.Data.bonuses) setBonuses(parsed.Data.bonuses);
        if (parsed.Data.difficulty) setDifficulty(parsed.Data.difficulty);
        addNotification(`Upgraded ${parsed.Data.upgradeId}!`);
      } else if (parsed.EventType === "rideRunning") {
        const { zoneId, durationSeconds } = parsed.Data;
        setRideTimers((prev) => {
          const filtered = prev.filter((t) => t.zoneId !== zoneId);
          return [...filtered, { zoneId, remaining: durationSeconds }];
        });
      } else if (parsed.EventType === "gameOver") {
        setGameOver(true);
      } else if (parsed.EventType === "unfreezeGuestTimers") {
        pausedRef.current = false;
      } else if (parsed.EventType === "milestoneUnlocked") {
        setPrestigeUnlocks((prev) => [...prev, ...parsed.Data.newFeatures]);
        addNotification(
          `🎉 Milestone Unlocked: ${parsed.Data.milestone.name}!`
        );
      } else if (parsed.EventType === "guestLeft") {
        addNotification(parsed.Data.message);
      } else if (parsed.EventType === "prestigeCompleted") {
        addNotification(parsed.Data.message);
        if (parsed.Data.difficulty) setDifficulty(parsed.Data.difficulty);
      } else if (parsed.EventType === "prestigeError") {
        addNotification(`❌ ${parsed.Data.message}`);
      } else if (parsed.EventType === "upgradeError") {
        addNotification(`❌ ${parsed.Data.message}`);
      }
    };

    ws.current.onerror = (error) => console.error("WebSocket error:", error);
    ws.current.onclose = () => console.log("WebSocket disconnected");

    return () => {
      ws.current?.close();
    };
  }, []);

  useEffect(() => {
    if (rideTimers.length === 0) return;

    const interval = setInterval(() => {
      setRideTimers((prevTimers) => {
        const updated: RideTimer[] = [];

        for (const timer of prevTimers) {
          const newRemaining = timer.remaining - 1;

          if (newRemaining <= 0) {
            if (ws.current?.readyState === WebSocket.OPEN) {
              ws.current.send(
                JSON.stringify({
                  EventType: "rideEnded",
                  EventTimestamp: Date.now(),
                  Source: { ClientType: "REACT_UI" },
                  Data: timer.zoneId,
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
  useEffect(() => {
    zones.forEach((zone) => {
      if (zone.rideCount >= autoStartNum) {
        const guestArr: string[] = [];
        guests.forEach((guest) => {
          if (guest.zoneId === zone.zoneId && guest.inRide) {
            guestArr.push(guest.id);
          }
        });
        if (ws.current && !rideTimers.find((t) => t.zoneId === zone.zoneId)) {
          ws.current.send(
            JSON.stringify({
              EventType: "startRide",
              EventTimestamp: Date.now(),
              Source: { ClientType: "REACT_UI" },
              Data: { zoneId: zone.zoneId, guests: JSON.stringify(guestArr) },
            })
          );
        }
      }
    });
  }, [guests]);
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
    if (ws.current && !zones.get(selectedZone)?.isRunning) {
      const uniqueGuests = selectedGuests.filter((guestId) =>
        guests.has(guestId)
      );
      ws.current.send(
        JSON.stringify({
          EventType: "addToRide",
          EventTimestamp: Date.now(),
          Source: { ClientType: "REACT_UI" },
          Data: { guests: JSON.stringify(uniqueGuests) },
        })
      );
    }
    setSelectedGuests([]);
  };

  const startRide = () => {
    const z = zones.get(selectedZone);
    const guestArr: string[] = [];
    guests.forEach((guest) => {
      if (guest.zoneId === selectedZone && guest.inRide) {
        guestArr.push(guest.id);
      }
    });

    if (!z) return;

    if (
      ws.current &&
      !rideTimers.find((t) => t.zoneId === selectedZone) &&
      z.rideCount > 0
    ) {
      ws.current.send(
        JSON.stringify({
          EventType: "startRide",
          EventTimestamp: Date.now(),
          Source: { ClientType: "REACT_UI" },
          Data: { zoneId: selectedZone, guests: JSON.stringify(guestArr) },
        })
      );
    }
  };

  const applyGlobalUpgrade = (upgradeType: string) => {
    if (upgradeType == "freezeGuestTimers") {
      pausedRef.current = true;
      console.log("PAUSED");
    }
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          EventType: "globalUpgrade",
          EventTimestamp: Date.now(),
          Source: { ClientType: "REACT_UI" },
          Data: { upgradeType },
        })
      );
    }
  };

  const applyZoneUpgrade = (zoneId: string, upgradeType: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          EventType: "zoneUpgrade",
          EventTimestamp: Date.now(),
          Source: { ClientType: "REACT_UI" },
          Data: { zoneId, upgradeType },
        })
      );
    }
  };

  const purchasePrestigeUpgrade = (upgradeId: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          EventType: "purchasePrestigeUpgrade",
          EventTimestamp: Date.now(),
          Source: { ClientType: "REACT_UI" },
          Data: { upgradeId },
        })
      );
    }
  };

  const performPrestige = () => {
    console.log("PRESTIGE");
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          EventType: "prestigeReset",
          EventTimestamp: Date.now(),
          Source: { ClientType: "REACT_UI" },
          Data: {},
        })
      );
    }
  };

  const getRemainingTimeForZone = (zoneId: string) => {
    const timer = rideTimers.find((t) => t.zoneId === zoneId);
    return timer ? timer.remaining : 0;
  };

  const restartLevel = () => {
    if (ws.current) {
      ws.current.send(
        JSON.stringify({
          EventType: "restart",
          EventTimestamp: Date.now(),
          Source: { ClientType: "REACT_UI" },
          Data: { restart: "restart" },
        })
      );
      window.location.reload();
    }
  };

  const getUpgradeCost = (upgrade: any, currentLevel: number) => {
    return upgrade.cost + Math.floor(currentLevel / 3);
  };

  const getCost = (baseCost: number) => {
    const discount = 1 - (bonuses.upgradeDiscount || 0);
    const difficultyMultiplier = difficulty.upgradeCostMultiplier || 1;
    return Math.floor(baseCost * discount * difficultyMultiplier);
  };

  const canPrestige = () => {
    return Number(balance) >= prestigeRequirement;
  };

  const getDifficultyColor = (multiplier: number, isPositive = false) => {
    if (multiplier === 1) return "text-green-400";
    if (isPositive) {
      return multiplier > 1 ? "text-green-400" : "text-red-400";
    }
    return multiplier > 1 ? "text-red-400" : "text-green-400";
  };

  return (
    <>
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification, index) => (
          <div
            key={index}
            className="bg-blue-800 text-white px-4 py-2 rounded shadow-lg animate-pulse"
          >
            {notification}
          </div>
        ))}
      </div>

      {!gameOver ? (
        <>
          <div className="flex justify-between items-center p-4 bg-gray-900">
            <h1 className="text-2xl font-bold">
              ${Math.round(Number(balance))} | Prestige: {prestige} | Points:{" "}
              {prestigePoints}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("park")}
                className={`px-4 py-2 ${
                  activeTab === "park" ? "bg-blue-600" : "bg-gray-600"
                }`}
              >
                Park
              </button>
              <button
                onClick={() => setActiveTab("prestige")}
                className={`px-4 py-2 ${
                  activeTab === "prestige" ? "bg-purple-600" : "bg-gray-600"
                }`}
              >
                Prestige
              </button>
            </div>
          </div>

          {/* Bonuses Display */}
          {bonuses.moneyMultiplier && (
            <div className="p-2 bg-gray-800 text-sm">
              💰 Money: {bonuses.moneyMultiplier.toFixed(1)}x | ⏱️ Patience: +
              {bonuses.guestPatienceBonus || 0}s | 💸 Discount:{" "}
              {((bonuses.upgradeDiscount || 0) * 100).toFixed(0)}%
            </div>
          )}

          {/* Difficulty Display */}
          {difficulty.frustrationSpeedMultiplier && prestige > 0 && (
            <div className="p-2 bg-red-900 text-sm border-b border-red-700">
              <span className="font-bold text-red-300">
                🔥 DIFFICULTY LEVEL {prestige}:
              </span>
              <span
                className={`ml-2 ${getDifficultyColor(
                  difficulty.frustrationSpeedMultiplier
                )}`}
              >
                Frustration: {difficulty.frustrationSpeedMultiplier.toFixed(1)}x
                faster
              </span>{" "}
              |
              <span
                className={`ml-1 ${getDifficultyColor(
                  difficulty.leavingPenaltyMultiplier
                )}`}
              >
                Leave Penalty: {difficulty.leavingPenaltyMultiplier.toFixed(1)}x
              </span>{" "}
              |
              <span
                className={`ml-1 ${getDifficultyColor(
                  difficulty.upgradeCostMultiplier
                )}`}
              >
                Upgrade Cost: {difficulty.upgradeCostMultiplier.toFixed(1)}x
              </span>{" "}
              |
              <span className="ml-1 text-yellow-400">
                Base Patience: {difficulty.baseGuestPatience}s
              </span>
            </div>
          )}

          {activeTab === "park" ? (
            <>
              {prestigeUnlocks.includes("autoRide") && (
                <div className=" my-4 p-2 bg-green-700 rounded-xl w-[30%] m-auto shadow-sm">
                  <h2 className="text-lg font-semibold mb-2">
                    Input the number of guests that will trigger auto-start
                  </h2>
                  <input
                    type="number"
                    className=" px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 5"
                    value={autoStartNum}
                    onChange={(e) => setAutoStartNum(Number(e.target.value))}
                    max={8}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
                {[
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
                ].map((upgrade) => {
                  const cost = getCost(upgrade.cost);
                  const canAfford = Number(balance) >= cost;
                  return (
                    <button
                      key={upgrade.type}
                      onClick={() =>
                        canAfford && applyGlobalUpgrade(upgrade.type)
                      }
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
                        Queue: {zone.queueCount}/{zone.queueCapacity}
                      </p>
                      <p>
                        Ride: {zone.rideCount}/{zone.rideCapacity}
                      </p>
                      <p>Time: {zone.rideTime}s</p>

                      <div className="mt-2 bg-[#1F1F2E] p-2 rounded text-sm">
                        <h3 className="font-semibold mb-2">🔧 Zone Upgrades</h3>
                        <div className="grid gap-1">
                          {[
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
                          ].map((upgrade) => {
                            const cost = getCost(upgrade.cost);
                            const canAfford = Number(balance) >= cost;
                            return (
                              <button
                                key={upgrade.type}
                                onClick={() =>
                                  canAfford &&
                                  applyZoneUpgrade(zone.zoneId, upgrade.type)
                                }
                                className={`p-1 rounded text-xs ${
                                  canAfford
                                    ? "bg-blue-700"
                                    : "bg-gray-600 cursor-not-allowed"
                                }`}
                              >
                                {canAfford ? `$${cost}` : `🔒 $${cost}`}{" "}
                                {upgrade.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {getRemainingTimeForZone(zone.zoneId) > 0 && (
                        <p className="text-yellow-400 font-bold mt-2">
                          Running: {getRemainingTimeForZone(zone.zoneId)}s
                        </p>
                      )}
                    </div>

                    {selectedZone === zone.zoneId && (
                      <div className="mb-2 p-2 bg-[#2A2A40] border-2 border-[#3C3C5C]">
                        <div className="mb-4">
                          <h2 className="text-lg text-white mb-2">
                            🎢 On Ride
                          </h2>
                          {(guestsByZone.get(zone.zoneId) || [])
                            .filter((g) => g.inRide)
                            .map((g) => (
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
                          {(guestsByZone.get(zone.zoneId) || [])
                            .filter((g) => !g.inRide)
                            .map((g) => {
                              const isLowPatience = g.timeToFrustration <= 3;
                              const isCritical = g.timeToFrustration <= 1;
                              return (
                                <div
                                  key={g.id}
                                  onClick={() => addSelectedGuest(g.id)}
                                  className={`text-white py-1 px-2 cursor-pointer mb-1 ${
                                    selectedGuests.includes(g.id)
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
                            onClick={addToRide}
                          >
                            Add to Ride
                          </button>
                          {!zone.isRunning && (
                            <button
                              className="bg-red-700 hover:bg-red-600 rounded p-2"
                              onClick={startRide}
                            >
                              Start
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-4">
              <div className="mb-6 p-4 bg-gray-800 rounded">
                <h2 className="text-2xl font-bold mb-4 text-purple-300">
                  🌟 Prestige System
                </h2>
                <p className="mb-4 text-gray-300">
                  Prestiging resets your park but grants prestige points and
                  increases difficulty! Each prestige level makes guests more
                  impatient and upgrades more expensive.
                </p>
                <div className="mb-4">
                  <div className="text-lg mb-2">
                    Progress to Prestige {prestige + 1}: $
                    {Math.round(Number(balance))} / $
                    {Math.floor(prestigeRequirement)}
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
                  onClick={performPrestige}
                  disabled={!canPrestige()}
                  className={`px-6 py-3 rounded font-bold text-lg ${
                    canPrestige()
                      ? "bg-purple-600 hover:bg-purple-700 animate-pulse"
                      : "bg-gray-600 cursor-not-allowed"
                  }`}
                >
                  {canPrestige()
                    ? `✨ PRESTIGE TO LEVEL ${prestige + 1} ✨`
                    : `Need $${Math.floor(
                        prestigeRequirement - Number(balance)
                      )} more!`}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prestigeUpgrades.map((upgrade) => {
                  const currentLevel = currentUpgrades[upgrade.id] || 0;
                  const cost = getUpgradeCost(upgrade, currentLevel);
                  const canAfford =
                    prestigePoints >= cost && currentLevel < upgrade.maxLevel;
                  const isMaxed = currentLevel >= upgrade.maxLevel;

                  return (
                    <div
                      key={upgrade.id}
                      className="bg-gray-800 p-4 rounded border-2 border-gray-700"
                    >
                      <h3 className="font-bold text-purple-300 mb-1">
                        {upgrade.name}
                      </h3>
                      <p className="text-sm text-gray-300 mb-3">
                        {upgrade.description}
                      </p>
                      <div className="text-sm mb-2 text-gray-400">
                        Level {currentLevel}/{upgrade.maxLevel}
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (currentLevel / upgrade.maxLevel) * 100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <button
                        onClick={() =>
                          canAfford && purchasePrestigeUpgrade(upgrade.id)
                        }
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
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-4xl font-bold mb-4">Game Over!</h1>
          <p className="text-lg mb-6 text-gray-300">
            Your park ran out of funds! Better luck next time.
          </p>
          <button
            onClick={restartLevel}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded font-bold text-lg"
          >
            Restart Game
          </button>
        </div>
      )}
    </>
  );
}

export default App;
