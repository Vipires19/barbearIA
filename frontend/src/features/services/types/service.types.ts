export type Service = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  duration_minutes: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceListResponse = {
  items: Service[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

export type ServiceListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
};

export type ServiceCreatePayload = {
  name: string;
  description?: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
};

export type ServiceUpdatePayload = Partial<ServiceCreatePayload>;
