# Theme Park Game - React Frontend

A real-time theme park management simulation built with React and TypeScript, featuring WebSocket communication for live game updates.

## 🎮 Overview

The frontend provides an interactive web interface for managing a theme park simulation, including guest management, ride operations, and a comprehensive prestige system. Players can upgrade rides, manage queues, and progress through multiple prestige levels while dealing with dynamic difficulty scaling.
## [View Full Documentation](https://github.com/Mateo-Rey/RollerCoasterSimulationFrontend/blob/main/Unreal%20Engine%20Rollercoaster%20Simulation.pdf)
<iframe width="789" height="444" src="https://www.youtube.com/embed/fMWdvbyK92s" title="Unreal Engine Rollercoaster Simulation Walkthrough" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
## ✨ Key Features

- **Real-time Guest Management**: Dynamic guest spawning and tracking across multiple park zones
- **Interactive Ride Operations**: Queue management, capacity planning, and ride control systems  
- **Prestige System**: Multi-layered progression with upgrades, milestone rewards, and prestige resets
- **Smart Automation**: Auto-ride features and intelligent queue management (unlocked via prestige)
- **Dynamic Difficulty**: Scaling challenges that increase with prestige level
- **Live Updates**: WebSocket-powered real-time synchronization with game server

## 🏗️ Architecture

### Component Structure
```
src/
├── components/
│   ├── Header.tsx                 # Game stats and navigation
│   ├── ZoneCard.tsx              # Individual zone display & controls
│   ├── ZoneGrid.tsx              # Zone container layout
│   ├── GuestList.tsx             # Guest management interface
│   ├── PrestigePanel.tsx         # Prestige system UI
│   ├── GlobalUpgrades.tsx        # Park-wide upgrade system
│   ├── AutoRideSettings.tsx      # Automation controls
│   ├── BonusesDisplay.tsx        # Active bonuses indicator
│   └── GameOverScreen.tsx        # Game over state
├── App.tsx                       # Main application & state management
├── schema.ts                     # Shared TypeScript definitions
└── App.css                       # Application styling
```

### State Management
The main App component manages all game state including:
- Zone and guest data (Maps for O(1) lookups)
- Balance and prestige progression
- Upgrade levels and unlocked features
- WebSocket connection and message handling
- UI state (selected zones, guests, active tabs)

## 🔌 WebSocket Communication

### Connection Setup
```typescript
const ws = useRef<WebSocket | null>(null);

useEffect(() => {
  ws.current = new WebSocket("ws://localhost:8080");
  
  ws.current.onopen = () => {
    // Identify as React client
    ws.current?.send(JSON.stringify({
      EventType: "identify",
      Source: { ClientType: "REACT_UI" },
      Data: { client: "react" }
    }));
  };
}, []);
```

### Key Events
- **Park Data Updates**: Receive complete game state every second
- **Guest Events**: Real-time guest spawning, movement, and frustration
- **Ride Operations**: Start rides, manage queues, handle completions
- **Upgrades**: Zone improvements and global park enhancements
- **Prestige Actions**: Purchase upgrades and trigger prestige resets

## 🎯 Core Features

### Zone Management
- **Real-time Statistics**: Queue/ride capacity, timing, revenue
- **Upgrade System**: Reduce ride times, increase capacity, expand queues
- **Visual Indicators**: Ride timers, lock states for premium zones
- **Cost Scaling**: Prices increase with difficulty multiplier

### Guest System
- **Visual Patience Indicators**: 
  - Green: >3 seconds remaining
  - Orange: 1-3 seconds  
  - Red (pulsing): <1 second (⚠ critical)
- **Guest Selection**: Click to select guests for ride assignment
- **Penalty System**: -$5 per frustrated guest (scales with difficulty)

### Prestige System
- **Progression Tracking**: Visual progress toward next prestige level
- **Upgrade Shop**: 5 different upgrade types with increasing costs
- **Milestone Rewards**: Unlock automation features at prestige 3, 6, and 9
- **Reset Mechanism**: Trade current progress for permanent bonuses

## 🚀 Installation & Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- WebSocket server running on port 8080

### Quick Start
```bash
# Clone repository
git clone [repository-url]
cd theme-park-client

# Install dependencies
npm install

# Start development server
npm start
```

The application will be available at `http://localhost:3000`

## 🛠️ Development

### Adding New Components
```typescript
// Create component with proper TypeScript interfaces
interface NewComponentProps {
  data: any;
  onAction: (value: string) => void;
}

const NewComponent = ({ data, onAction }: NewComponentProps) => {
  return <div className="new-component">{/* Component JSX */}</div>;
};
```

### WebSocket Event Handling
```typescript
// Add new event handler in App.tsx
else if (parsed.EventType === "newEvent") {
  handleNewEvent(parsed.Data);
  addNotification("New event received!");
}
```

## 🔧 Configuration

- **WebSocket URL**: Configurable in App.tsx connection setup
- **Update Intervals**: Server broadcasts park data every 1000ms
- **Cost Scaling**: Upgrade costs scale with prestige difficulty multiplier
- **Guest Spawn Rate**: Controlled by backend (default: 1000ms intervals)

## 📱 UI Features

- **Responsive Design**: Adapts to different screen sizes
- **Toast Notifications**: Real-time feedback for all game actions  
- **Tab Navigation**: Switch between Park Management and Prestige panels
- **Visual Feedback**: Color-coded states, progress bars, and status indicators
- **Keyboard Support**: Accessible controls for all interactions
