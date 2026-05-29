export type ServiceSummary = {

  id: string;

  name: string;

};



export type ProfessionalAvailability = {

  id: string;

  professional_id: string;

  weekday: number;

  start_time: string;

  end_time: string;

  active: boolean;

};



export type Professional = {

  id: string;

  name: string;

  bio: string | null;

  avatar_url: string | null;

  specialties: string[];

  is_active: boolean;

  participation_percentage: number;

  active_for_distribution: boolean;

  is_publicly_visible: boolean;

  user_id?: string | null;

  login_email?: string | null;

  login_is_active?: boolean | null;

  services: ServiceSummary[];

  availabilities?: ProfessionalAvailability[];

  created_at: string;

  updated_at: string;

};



export type ProfessionalListResponse = {

  items: Professional[];

  total: number;

  page: number;

  page_size: number;

  pages: number;

};



export type ProfessionalListParams = {

  page?: number;

  page_size?: number;

  search?: string;

  is_active?: boolean;

  service_id?: string;

};



export type ProfessionalCreatePayload = {

  name: string;

  login_email: string;

  login_password?: string | null;

  is_active: boolean;

};



export type ProfessionalCreateResponse = Professional & {

  temporary_password?: string | null;

};



export type ProfessionalAdminUpdatePayload = {

  name?: string;

  is_active?: boolean;

  participation_percentage?: number;

  active_for_distribution?: boolean;

};



export type ProfessionalProfileUpdatePayload = {

  bio?: string | null;

  specialties?: string[];

  service_ids?: string[];

  is_publicly_visible?: boolean;

};



export type ProfessionalAccessCreatePayload = {

  email: string;

  password: string;

};



export type ProfessionalAccessUpdatePayload = {

  email?: string;

  is_active?: boolean;

};



export type ProfessionalResetPasswordPayload = {

  new_password: string;

};

