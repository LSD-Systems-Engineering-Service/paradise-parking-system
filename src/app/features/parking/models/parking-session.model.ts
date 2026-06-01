import { PaymentStatus, RateType, VehicleType } from "../../../../graphql/generated/graphql";
import { PaginatedResponse } from "../../../shared/types/paginated-response.type";

export interface ParkingSession {
  id: string;
  vehicleType: VehicleType;
  plateNumber: string;
  enteredAt: string;
  exitedAt?: string | null;
  durationMinutes?: number | null;
  paymentStatus: PaymentStatus
  parkingFee?: number | null;
  rateType: RateType;
}

export interface ParkingSessionsByParkingStateResponse {
  parkingSessionsByParkingState: PaginatedResponse<ParkingSession>;
}

export interface ParkingSessionsVariables {
  page: number;
  limit: number;
  parkingState: 'ACTIVE' | 'EXITED';
}
