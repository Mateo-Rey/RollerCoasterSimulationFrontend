interface HeaderProps {
  balance?: string;
  prestige: number;
  prestigePoints: number;
  activeTab: "park" | "prestige";
  onTabChange: (tab: "park" | "prestige") => void;
}

const Header = ({
  balance,
  prestige,
  prestigePoints,
  activeTab,
  onTabChange,
}: HeaderProps) => {
  return (
    <div className="flex justify-between items-center p-4 bg-gray-900">
      <h1 className="text-2xl font-bold">
        ${Math.round(Number(balance))} | Prestige: {prestige} | Points:{" "}
        {prestigePoints}
      </h1>
      <div className="flex gap-2">
        <button
          onClick={() => onTabChange("park")}
          className={`px-4 py-2 ${
            activeTab === "park" ? "bg-blue-600" : "bg-gray-600"
          }`}
        >
          Park
        </button>
        <button
          onClick={() => onTabChange("prestige")}
          className={`px-4 py-2 ${
            activeTab === "prestige" ? "bg-purple-600" : "bg-gray-600"
          }`}
        >
          Prestige
        </button>
      </div>
    </div>
  );
};

export default Header;