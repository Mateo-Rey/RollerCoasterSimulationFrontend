import { useState, useEffect, useRef, useMemo } from "react";
import { Zone, Guest } from "./schema";
import "./App.css";

// Component imports
import Header from "./components/Header.tsx";
import NotificationContainer from "./components/NotificationContainer.tsx";
import BonusesDisplay from "./components/BonusesDisplay.tsx";
import DifficultyDisplay from "./components/DifficultyDisplay.tsx";
import GlobalUpgrades from "./components/GlobalUpgrades.tsx";
import AutoRideSettings from "./components/AutoRideSettings.tsx";
import ZoneGrid from "./components/ZoneGrid.tsx";
import PrestigePanel from "./components/PrestigePanel.tsx";
import GameOverScreen from "./components/GameOverScreen.tsx";

type RideTimer = {
  zoneId: string;
  remaining: number;
};

function App() {
  // State declarations
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
  const [smartQueue, setSmartQueue] = useState<boolean>(false);

  // Refs
  const ws = useRef<WebSocket | null>(null);
  const dispatchedGuestsByZone = useRef<Map<string, Set<string>>>(new Map());

  // Update selected guests when guests change
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

  // WebSocket connection effect
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
        setPrestige(parsed.Data.prestige);
        setPrestigePoints(parsed.Data.prestigePoints);
        setPrestigeUpgrades(parsed.Data.prestigeUpgrades);
        setCurrentUpgrades(parsed.Data.currentUpgrades);
        setPrestigeUnlocks(parsed.Data.unlockedFeatures);
        setBonuses(parsed.Data.bonuses);
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
        addNotification(`🎉 Milestone Unlocked: ${parsed.Data.milestone.name}!`);
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

  // Smart queue effect
  useEffect(() => {
    if (!smartQueue) return;

    const interval = setInterval(() => {
      if (smartQueue) {
        zones.forEach((z) => {
          if (!z.isRunning && z.rideCapacity - z.rideCount !== 0) {
            //check which guests have already been sent on react side
            const sentSet = dispatchedGuestsByZone.current.get(z.zoneId) || new Set();
            //filter available guests by their ticket price from most to least cost
            const guestsByPrice = (guestsByZone.get(z.zoneId) || [])
              .filter((g) => !g.inRide && !sentSet.has(g.id))
              .sort((a, b) => b.ticketPrice - a.ticketPrice)
              .slice(0, z.rideCapacity - z.rideCount);

            const guestIds = guestsByPrice.map((g) => g.id);

            if (guestIds.length > 0 && ws.current?.readyState === WebSocket.OPEN) {
              guestIds.forEach((id) => sentSet.add(id));
              dispatchedGuestsByZone.current.set(z.zoneId, sentSet);

              ws.current.send(
                JSON.stringify({
                  EventType: "addToRide",
                  EventTimestamp: Date.now(),
                  Source: { ClientType: "REACT_UI" },
                  Data: { guests: JSON.stringify(guestIds) },
                })
              );
            }
          } else if (z.isRunning) {
            dispatchedGuestsByZone.current.delete(z.zoneId);
          }
        });
      }
    }, 200);

    return () => clearInterval(interval);
  }, [smartQueue, guests, zones]);

  // Ride timer effect
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

  // Auto-start rides effect
  useEffect(() => {
    zones.forEach((zone) => {
      if (zone.rideCount >= autoStartNum && prestigeUnlocks.includes("autoRide")) {
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
  }, [guests, zones, rideTimers, autoStartNum, prestigeUnlocks]);

  // Memoized values
  const guestsArray = useMemo(() => Array.from(guests.values()), [guests]);
  const guestsByZone = useMemo(() => {
    const map = new Map<string, Guest[]>();
    for (const guest of guestsArray) {
      if (!map.has(guest.zoneId)) map.set(guest.zoneId, []);
      map.get(guest.zoneId)!.push(guest);
    }
    return map;
  }, [guestsArray]);

  // Handler functions
  const addSelectedGuest = (id: string) => {
    setSelectedGuests((prev) =>
      prev.includes(id) ? prev.filter((guestId) => guestId !== id) : [...prev, id]
    );
  };

  const addToRide = () => {
    if (ws.current && !zones.get(selectedZone)?.isRunning) {
      const uniqueGuests = selectedGuests.filter((guestId) => guests.has(guestId));
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

    if (ws.current && !rideTimers.find((t) => t.zoneId === selectedZone) && z.rideCount > 0) {
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
      <NotificationContainer notifications={notifications} />

      {!gameOver ? (
        <>
          <Header
            balance={balance}
            prestige={prestige}
            prestigePoints={prestigePoints}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <BonusesDisplay bonuses={bonuses} prestigeUnlocks={prestigeUnlocks} />

          <DifficultyDisplay
            difficulty={difficulty}
            prestige={prestige}
            getDifficultyColor={getDifficultyColor}
          />

          {activeTab === "park" ? (
            <>
              <div className="flex justify-center gap-4">
                <AutoRideSettings
                  prestigeUnlocks={prestigeUnlocks}
                  autoStartNum={autoStartNum}
                  onAutoStartNumChange={setAutoStartNum}
                  onActivateSmartQueue={() => setSmartQueue(true)}
                />
              </div>

              <GlobalUpgrades
                balance={balance}
                getCost={getCost}
                onApplyUpgrade={applyGlobalUpgrade}
              />

              <ZoneGrid
                zones={zones}
                guests={guests}
                guestsByZone={guestsByZone}
                selectedZone={selectedZone}
                selectedGuests={selectedGuests}
                prestigeUnlocks={prestigeUnlocks}
                rideTimers={rideTimers}
                balance={balance}
                onZoneSelect={setSelectedZone}
                onSelectedGuestsChange={setSelectedGuests}
                onGuestSelect={addSelectedGuest}
                onAddToRide={addToRide}
                onStartRide={startRide}
                onZoneUpgrade={applyZoneUpgrade}
                getCost={getCost}
                getRemainingTimeForZone={getRemainingTimeForZone}
              />
            </>
          ) : (
            <PrestigePanel
              prestige={prestige}
              prestigePoints={prestigePoints}
              balance={balance}
              prestigeRequirement={prestigeRequirement}
              prestigeUpgrades={prestigeUpgrades}
              currentUpgrades={currentUpgrades}
              onPerformPrestige={performPrestige}
              onPurchaseUpgrade={purchasePrestigeUpgrade}
              canPrestige={canPrestige}
              getUpgradeCost={getUpgradeCost}
            />
          )}
        </>
      ) : (
        <GameOverScreen onRestart={restartLevel} />
      )}
    </>
  );
}

export default App;