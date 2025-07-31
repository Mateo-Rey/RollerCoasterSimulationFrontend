interface AutoRideSettingsProps {
  prestigeUnlocks: any[];
  autoStartNum: number;
  onAutoStartNumChange: (num: number) => void;
  onActivateSmartQueue: () => void;
}

const AutoRideSettings = ({
  prestigeUnlocks,
  autoStartNum,
  onAutoStartNumChange,
  onActivateSmartQueue,
}: AutoRideSettingsProps) => {
  return (
    <>
      {prestigeUnlocks.includes("autoRide") && (
        <div className="my-4 p-2 bg-green-700 rounded-xl w-[30%] shadow-sm">
          <h2 className="text-lg font-semibold mb-2">
            Input the number of guests that will trigger auto-start
          </h2>
          <input
            type="number"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 5"
            value={autoStartNum}
            onChange={(e) => onAutoStartNumChange(Number(e.target.value))}
            max={8}
          />
        </div>
      )}
      {prestigeUnlocks.includes("smartQueue") && (
        <button
          className="bg-red-500 p-2 h-12 self-center rounded-lg hover:scale-[1.1] hover:bg-red-600 transition-all"
          onClick={onActivateSmartQueue}
        >
          Activate Smart Queue
        </button>
      )}
    </>
  );
};

export default AutoRideSettings;