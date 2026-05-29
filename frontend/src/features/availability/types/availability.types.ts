export type AvailabilityTimeBlock = {
  start_time: string;
  end_time: string;
};

export type WeekdayAvailability = {
  weekday: number;
  active: boolean;
  blocks: AvailabilityTimeBlock[];
};

export type WeekdayAvailabilityPayload = WeekdayAvailability[];
