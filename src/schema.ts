export interface Zone {
  zoneId: string;
  zoneName: string;
  rideCapacity: number;
  queueCount: number;
  queueCapacity: number;
  isRunning: boolean;
  rideCount: number,
  rideTime: number;
}

export interface Guest {
  id: string;
  timeToFrustration: number;
  zoneId: string;
  inRide: boolean;
}

export interface Message {
    EventType: string;
    EventTimestamp: string;
    Source: string;
    Data: string;
}
