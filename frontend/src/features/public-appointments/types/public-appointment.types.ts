import type { AppointmentStatus } from "@/features/appointments/types/appointment.types";



export type PublicAppointmentServiceItem = {

  name: string;

  duration_minutes: number;

};



export type PublicAppointment = {

  id: string;

  service_ids: string[];

  professional_id: string;

  client_display_name: string;

  services: PublicAppointmentServiceItem[];

  professional: { name: string };

  appointment_date: string;

  start_time: string;

  end_time: string;

  total_duration_minutes: number;

  status: AppointmentStatus;

};



export function getPublicServiceLabel(appointment: PublicAppointment): string {

  return appointment.services.map((s) => s.name).join(" + ") || "—";

}



export function getPublicPrimaryServiceId(appointment: PublicAppointment): string | undefined {

  return appointment.service_ids[0];

}



export type PublicAppointmentListResponse = {

  items: PublicAppointment[];

  upcoming: PublicAppointment[];

  past: PublicAppointment[];

};



export type PublicAppointmentListParams = {

  phone: string;

  scope?: "all" | "upcoming" | "past";

};



export type PublicAppointmentCancelPayload = {

  phone: string;

  notes?: string;

};



export type PublicAppointmentReschedulePayload = {

  phone: string;

  appointment_date: string;

  start_time: string;

  professional_id?: string | null;

};



export type PublicAppointmentCreatePayload = {

  client_name: string;

  client_phone: string;

  client_email?: string | null;

  service_ids: string[];

  professional_id: string;

  appointment_date: string;

  start_time: string;

  notes?: string | null;

};

