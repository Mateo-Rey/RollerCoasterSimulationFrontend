interface GameOverScreenProps {
  onRestart: () => void;
}

const GameOverScreen = ({ onRestart }: GameOverScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">Game Over!</h1>
      <p className="text-lg mb-6 text-gray-300">
        Your park ran out of funds! Better luck next time.
      </p>
      <button
        onClick={onRestart}
        className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded font-bold text-lg"
      >
        Restart Game
      </button>
    </div>
  );
};

export default GameOverScreen;