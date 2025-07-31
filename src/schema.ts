export interface Zone {
  zoneId: string;
  zoneName: string;
  rideCapacity: number;
  queueCount: number;
  queueCapacity: number;
  isRunning: boolean;
  rideCount: number,
  rideTime: number;
  multiplier: number;
}

export interface Guest {
  id: string;
  timeToFrustration: number;
  zoneId: string;
  inRide: boolean;
  type: string;
  ticketPrice: number;
}

export interface Message {
    EventType: string;
    EventTimestamp: string;
    Source: string;
    Data: string;
}
