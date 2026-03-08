import { gql } from 'apollo-angular';
import { Injectable } from '@angular/core';
import * as Apollo from 'apollo-angular';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: any; output: any; }
};

export type CreateMonthlySessionInput = {
  monthlyEnd: Scalars['DateTime']['input'];
  monthlyStart: Scalars['DateTime']['input'];
  plateNumber: Scalars['String']['input'];
  rateType: Scalars['String']['input'];
  vehicleType: Scalars['String']['input'];
};

export type CreateParkingSessionInput = {
  plateNumber: Scalars['String']['input'];
  rateType: Scalars['String']['input'];
  vehicleType: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createMonthlySession: ParkingSession;
  createParkingSession: ParkingSession;
  exitParkingSession: ParkingSession;
  includeParkingSessionInBIR: ParkingSession;
};


export type MutationCreateMonthlySessionArgs = {
  input: CreateMonthlySessionInput;
};


export type MutationCreateParkingSessionArgs = {
  input: CreateParkingSessionInput;
};


export type MutationExitParkingSessionArgs = {
  id: Scalars['String']['input'];
};


export type MutationIncludeParkingSessionInBirArgs = {
  id: Scalars['String']['input'];
};

export type PaginatedParkingSessions = {
  __typename?: 'PaginatedParkingSessions';
  data: Array<ParkingSession>;
  meta: PaginationMeta;
};

export type PaginationMeta = {
  __typename?: 'PaginationMeta';
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  limit: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type ParkingSession = {
  __typename?: 'ParkingSession';
  durationMinutes?: Maybe<Scalars['Int']['output']>;
  enteredAt: Scalars['DateTime']['output'];
  exitedAt?: Maybe<Scalars['DateTime']['output']>;
  guardRemarks?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  includeInBIRReport: Scalars['Boolean']['output'];
  monthlyEnd?: Maybe<Scalars['DateTime']['output']>;
  monthlyStart?: Maybe<Scalars['DateTime']['output']>;
  parkingCredits?: Maybe<Scalars['Int']['output']>;
  parkingFee?: Maybe<Scalars['Float']['output']>;
  parkingState: ParkingState;
  paymentStatus: PaymentStatus;
  plateNumber: Scalars['String']['output'];
  rateType: RateType;
  vehicleModel?: Maybe<Scalars['String']['output']>;
  vehicleType: VehicleType;
};

export enum ParkingState {
  Active = 'ACTIVE',
  Exited = 'EXITED'
}

export type ParkingStatistics = {
  __typename?: 'ParkingStatistics';
  currentlyParked: Scalars['Int']['output'];
  parkedMotorcycles: Scalars['Int']['output'];
  parkedVehicles: Scalars['Int']['output'];
  revenueToday: Scalars['Float']['output'];
  totalEntriesToday: Scalars['Int']['output'];
};

export enum PaymentStatus {
  Overdue = 'OVERDUE',
  Paid = 'PAID',
  Unpaid = 'UNPAID'
}

export type Query = {
  __typename?: 'Query';
  monthlySessions: PaginatedParkingSessions;
  parkingSessions: PaginatedParkingSessions;
  parkingSessionsByParkingState: PaginatedParkingSessions;
  parkingStatistics: ParkingStatistics;
  vehicleStats: Array<VehicleStats>;
};


export type QueryMonthlySessionsArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  rateType: Scalars['String']['input'];
};


export type QueryParkingSessionsArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};


export type QueryParkingSessionsByParkingStateArgs = {
  date: Scalars['String']['input'];
  includeInBIRReport?: InputMaybe<Scalars['Boolean']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  parkingState: Scalars['String']['input'];
};


export type QueryParkingStatisticsArgs = {
  date: Scalars['String']['input'];
  includeInBIRReport?: InputMaybe<Scalars['Boolean']['input']>;
  parkingState: Scalars['String']['input'];
};


export type QueryVehicleStatsArgs = {
  date: Scalars['DateTime']['input'];
};

export enum RateType {
  Hourly = 'HOURLY',
  Monthly = 'MONTHLY',
  Overnight = 'OVERNIGHT'
}

export type VehicleStats = {
  __typename?: 'VehicleStats';
  name: Scalars['String']['output'];
  value: Scalars['Int']['output'];
};

export enum VehicleType {
  Car = 'CAR',
  Motorcycle = 'MOTORCYCLE',
  Truck = 'TRUCK'
}

export type CreateMonthlySessionMutationVariables = Exact<{
  input: CreateMonthlySessionInput;
}>;


export type CreateMonthlySessionMutation = { __typename?: 'Mutation', createMonthlySession: { __typename?: 'ParkingSession', id: string, vehicleType: VehicleType, plateNumber: string, enteredAt: any, paymentStatus: PaymentStatus, parkingState: ParkingState, rateType: RateType } };

export type CreateParkingSessionMutationVariables = Exact<{
  input: CreateParkingSessionInput;
}>;


export type CreateParkingSessionMutation = { __typename?: 'Mutation', createParkingSession: { __typename?: 'ParkingSession', id: string, vehicleType: VehicleType, plateNumber: string, enteredAt: any, paymentStatus: PaymentStatus, parkingState: ParkingState, rateType: RateType } };

export type ExitParkingSessionMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type ExitParkingSessionMutation = { __typename?: 'Mutation', exitParkingSession: { __typename?: 'ParkingSession', id: string, parkingState: ParkingState, exitedAt?: any | null, paymentStatus: PaymentStatus } };

export type MonthlySessionsQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
  rateType: Scalars['String']['input'];
}>;


export type MonthlySessionsQuery = { __typename?: 'Query', monthlySessions: { __typename?: 'PaginatedParkingSessions', data: Array<{ __typename?: 'ParkingSession', id: string, vehicleType: VehicleType, plateNumber: string, enteredAt: any, exitedAt?: any | null, durationMinutes?: number | null, parkingFee?: number | null, parkingState: ParkingState, paymentStatus: PaymentStatus, rateType: RateType, includeInBIRReport: boolean, monthlyStart?: any | null, monthlyEnd?: any | null }>, meta: { __typename?: 'PaginationMeta', total: number, page: number, totalPages: number } } };

export type GetParkingSessionsQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
  parkingState: Scalars['String']['input'];
  date: Scalars['String']['input'];
  includeInBIRReport?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetParkingSessionsQuery = { __typename?: 'Query', parkingSessionsByParkingState: { __typename?: 'PaginatedParkingSessions', data: Array<{ __typename?: 'ParkingSession', id: string, vehicleType: VehicleType, plateNumber: string, enteredAt: any, exitedAt?: any | null, durationMinutes?: number | null, parkingFee?: number | null, parkingState: ParkingState, paymentStatus: PaymentStatus, includeInBIRReport: boolean }>, meta: { __typename?: 'PaginationMeta', total: number, page: number, totalPages: number } } };

export type GetParkingStatisticsQueryVariables = Exact<{
  parkingState: Scalars['String']['input'];
  date: Scalars['String']['input'];
  includeInBIRReport?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetParkingStatisticsQuery = { __typename?: 'Query', parkingStatistics: { __typename?: 'ParkingStatistics', parkedVehicles: number, parkedMotorcycles: number, revenueToday: number, currentlyParked: number, totalEntriesToday: number } };

export type IncludeParkingSessionInBirMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type IncludeParkingSessionInBirMutation = { __typename?: 'Mutation', includeParkingSessionInBIR: { __typename?: 'ParkingSession', id: string, vehicleType: VehicleType, plateNumber: string, enteredAt: any, exitedAt?: any | null, durationMinutes?: number | null, parkingFee?: number | null, parkingState: ParkingState, paymentStatus: PaymentStatus, includeInBIRReport: boolean } };

export const CreateMonthlySessionDocument = gql`
    mutation CreateMonthlySession($input: CreateMonthlySessionInput!) {
  createMonthlySession(input: $input) {
    id
    vehicleType
    plateNumber
    enteredAt
    paymentStatus
    parkingState
    rateType
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class CreateMonthlySessionGQL extends Apollo.Mutation<CreateMonthlySessionMutation, CreateMonthlySessionMutationVariables> {
    override document = CreateMonthlySessionDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const CreateParkingSessionDocument = gql`
    mutation CreateParkingSession($input: CreateParkingSessionInput!) {
  createParkingSession(input: $input) {
    id
    vehicleType
    plateNumber
    enteredAt
    paymentStatus
    parkingState
    rateType
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class CreateParkingSessionGQL extends Apollo.Mutation<CreateParkingSessionMutation, CreateParkingSessionMutationVariables> {
    override document = CreateParkingSessionDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const ExitParkingSessionDocument = gql`
    mutation ExitParkingSession($id: String!) {
  exitParkingSession(id: $id) {
    id
    parkingState
    exitedAt
    paymentStatus
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class ExitParkingSessionGQL extends Apollo.Mutation<ExitParkingSessionMutation, ExitParkingSessionMutationVariables> {
    override document = ExitParkingSessionDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const MonthlySessionsDocument = gql`
    query MonthlySessions($page: Int!, $limit: Int!, $rateType: String!) {
  monthlySessions(page: $page, limit: $limit, rateType: $rateType) {
    data {
      id
      vehicleType
      plateNumber
      enteredAt
      exitedAt
      durationMinutes
      parkingFee
      parkingState
      paymentStatus
      rateType
      includeInBIRReport
      monthlyStart
      monthlyEnd
    }
    meta {
      total
      page
      totalPages
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class MonthlySessionsGQL extends Apollo.Query<MonthlySessionsQuery, MonthlySessionsQueryVariables> {
    override document = MonthlySessionsDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const GetParkingSessionsDocument = gql`
    query GetParkingSessions($page: Int!, $limit: Int!, $parkingState: String!, $date: String!, $includeInBIRReport: Boolean) {
  parkingSessionsByParkingState(
    page: $page
    limit: $limit
    parkingState: $parkingState
    date: $date
    includeInBIRReport: $includeInBIRReport
  ) {
    data {
      id
      vehicleType
      plateNumber
      enteredAt
      exitedAt
      durationMinutes
      parkingFee
      parkingState
      paymentStatus
      includeInBIRReport
    }
    meta {
      total
      page
      totalPages
    }
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class GetParkingSessionsGQL extends Apollo.Query<GetParkingSessionsQuery, GetParkingSessionsQueryVariables> {
    override document = GetParkingSessionsDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const GetParkingStatisticsDocument = gql`
    query GetParkingStatistics($parkingState: String!, $date: String!, $includeInBIRReport: Boolean) {
  parkingStatistics(
    parkingState: $parkingState
    date: $date
    includeInBIRReport: $includeInBIRReport
  ) {
    parkedVehicles
    parkedMotorcycles
    revenueToday
    currentlyParked
    totalEntriesToday
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class GetParkingStatisticsGQL extends Apollo.Query<GetParkingStatisticsQuery, GetParkingStatisticsQueryVariables> {
    override document = GetParkingStatisticsDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }
export const IncludeParkingSessionInBirDocument = gql`
    mutation IncludeParkingSessionInBIR($id: String!) {
  includeParkingSessionInBIR(id: $id) {
    id
    vehicleType
    plateNumber
    enteredAt
    exitedAt
    durationMinutes
    parkingFee
    parkingState
    paymentStatus
    includeInBIRReport
  }
}
    `;

  @Injectable({
    providedIn: 'root'
  })
  export class IncludeParkingSessionInBirGQL extends Apollo.Mutation<IncludeParkingSessionInBirMutation, IncludeParkingSessionInBirMutationVariables> {
    override document = IncludeParkingSessionInBirDocument;
    
    constructor(apollo: Apollo.Apollo) {
      super(apollo);
    }
  }