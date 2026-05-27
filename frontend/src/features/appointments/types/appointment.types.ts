export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";

export type AppointmentItemSummary = {
  id: string;
  service_id: string;
  service_name: string;
  duration_minutes: number;
  price: number;
  position: number;
};

export type AppointmentProfessionalSummary = {
  id: string;
  name: string;
  avatar_url: string | null;
};

export type Appointment = {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  professional_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  total_duration_minutes: number;
  total_price: number;
  status: AppointmentStatus;
  notes: string | null;
  items: AppointmentItemSummary[];
  professional: AppointmentProfessionalSummary;
  created_at: string;
  updated_at: string;
};

export function getAppointmentServiceLabel(appointment: Appointment): string {
  return appointment.items.map((i) => i.service_name).join(" + ") || "—";
}

export function getPrimaryServiceId(appointment: Appointment): string | undefined {
  return appointment.items[0]?.service_id;
}

export type AppointmentListResponse = {
  items: Appointment[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

export type AppointmentListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  status?: AppointmentStatus;
  professional_id?: string;
  service_id?: string;
  date_from?: string;
  date_to?: string;
};

export type AppointmentCreatePayload = {
  client_name: string;
  client_phone: string;
  client_email?: string | null;
  service_ids: string[];
  professional_id: string;
  appointment_date: string;
  start_time: string;
  notes?: string | null;
};

export type AppointmentUpdatePayload = {
  client_name?: string;
  client_phone?: string;
  client_email?: string | null;
  status?: AppointmentStatus;
  notes?: string | null;
};

export type AppointmentReschedulePayload = {
  appointment_date: string;
  start_time: string;
  professional_id?: string;
};

export type AppointmentCancelPayload = {
  notes?: string | null;
};

export type AvailableSlot = {
  start_time: string;
  end_time: string;
  available: boolean;
};

export type AvailableSlotsResponse = {
  professional_id: string;
  service_ids: string[];
  date: string;
  duration_minutes: number;
  slots: AvailableSlot[];
};
