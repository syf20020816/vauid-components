export const NoteTitles = {
  T1: "t1",
  T2: "t2",
  T3: "t3",
};

export type NoteTitle = (typeof NoteTitles)[keyof typeof NoteTitles];

export const NoteUnOrders = {
  U1: "u1",
  U2: "u2",
  U3: "u3",
};

export type NoteUnOrder = (typeof NoteUnOrders)[keyof typeof NoteUnOrders];

export const NoteOrders = {
  O1: "o1",
  O2: "o2",
  O3: "o3",
};

export type NoteOrder = (typeof NoteOrders)[keyof typeof NoteOrders];

export type NoteValueType = NoteTitle | NoteUnOrder | NoteOrder | "text";

export interface NoteValue {
  type: NoteValueType;
  value: string;
}
