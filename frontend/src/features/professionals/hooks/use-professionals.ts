"use client";



import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";



import {

  createProfessional,

  createProfessionalAccess,

  deleteProfessional,

  deleteProfessionalAccess,

  fetchMyProfile,

  fetchProfessional,

  fetchProfessionals,

  resetProfessionalPassword,

  updateMyProfile,

  updateProfessional,

  updateProfessionalAccess,

  updateProfessionalProfile,

  uploadMyAvatar,

  uploadProfessionalAvatar,

} from "@/features/professionals/api/professionals.api";

import type {

  Professional,

  ProfessionalAccessCreatePayload,

  ProfessionalAccessUpdatePayload,

  ProfessionalAdminUpdatePayload,

  ProfessionalCreatePayload,

  ProfessionalListParams,

  ProfessionalProfileUpdatePayload,

  ProfessionalResetPasswordPayload,

} from "@/features/professionals/types/professional.types";

import { getApiErrorMessage } from "@/lib/api-client";



export const professionalsKeys = {

  all: ["professionals"] as const,

  list: (params: ProfessionalListParams) => [...professionalsKeys.all, "list", params] as const,

  detail: (id: string) => [...professionalsKeys.all, "detail", id] as const,

  me: () => [...professionalsKeys.all, "me"] as const,

};



export function useProfessionalsList(params: ProfessionalListParams) {

  return useQuery({

    queryKey: professionalsKeys.list(params),

    queryFn: () => fetchProfessionals(params),

  });

}



export function useProfessional(id: string) {

  return useQuery({

    queryKey: professionalsKeys.detail(id),

    queryFn: () => fetchProfessional(id),

    enabled: Boolean(id),

  });

}



export function useMyProfile() {

  return useQuery({

    queryKey: professionalsKeys.me(),

    queryFn: () => fetchMyProfile(),

  });

}



export function useCreateProfessional() {

  const qc = useQueryClient();

  return useMutation({

    mutationFn: (payload: ProfessionalCreatePayload) => createProfessional(payload),

    onSuccess: (data) => {

      qc.invalidateQueries({ queryKey: professionalsKeys.all });

      if (data.temporary_password) {

        toast.success("Profissional criado", {

          description: `Senha temporária: ${data.temporary_password}`,

          duration: 20000,

        });

      } else {

        toast.success("Profissional criado com acesso ao dashboard");

      }

    },

    onError: (e) => toast.error(getApiErrorMessage(e)),

  });

}



export function useUpdateProfessional(id: string) {

  const qc = useQueryClient();

  return useMutation({

    mutationFn: (payload: ProfessionalAdminUpdatePayload) => updateProfessional(id, payload),

    onSuccess: (data) => {

      qc.setQueryData(professionalsKeys.detail(id), data);

      qc.invalidateQueries({ queryKey: professionalsKeys.all });

      toast.success("Profissional atualizado");

    },

    onError: (e) => toast.error(getApiErrorMessage(e)),

  });

}



export function useUpdateProfessionalProfile(id: string) {

  const qc = useQueryClient();

  return useMutation({

    mutationFn: (payload: ProfessionalProfileUpdatePayload) =>

      updateProfessionalProfile(id, payload),

    onSuccess: (data) => {

      qc.setQueryData(professionalsKeys.detail(id), data);

      qc.invalidateQueries({ queryKey: professionalsKeys.all });

      qc.invalidateQueries({ queryKey: professionalsKeys.me() });

      toast.success("Perfil atualizado");

    },

    onError: (e) => toast.error(getApiErrorMessage(e)),

  });

}



export function useUpdateMyProfile() {

  const qc = useQueryClient();

  return useMutation({

    mutationFn: (payload: ProfessionalProfileUpdatePayload) => updateMyProfile(payload),

    onSuccess: (data) => {

      qc.setQueryData(professionalsKeys.me(), data);

      qc.invalidateQueries({ queryKey: professionalsKeys.all });

      toast.success("Perfil atualizado");

    },

    onError: (e) => toast.error(getApiErrorMessage(e)),

  });

}



export function useDeleteProfessional() {

  const qc = useQueryClient();

  return useMutation({

    mutationFn: (id: string) => deleteProfessional(id),

    onSuccess: () => {

      qc.invalidateQueries({ queryKey: professionalsKeys.all });

      toast.success("Profissional excluído");

    },

    onError: (e) => toast.error(getApiErrorMessage(e)),

  });

}



export function useUploadProfessionalAvatar(id: string) {

  const qc = useQueryClient();

  return useMutation({

    mutationFn: (file: File) => uploadProfessionalAvatar(id, file),

    onSuccess: (data) => {

      qc.setQueryData(professionalsKeys.detail(id), data);

      qc.invalidateQueries({ queryKey: professionalsKeys.all });

      toast.success("Avatar atualizado");

    },

    onError: (e) => toast.error(getApiErrorMessage(e)),

  });

}



export function useUploadMyAvatar() {

  const qc = useQueryClient();

  return useMutation({

    mutationFn: (file: File) => uploadMyAvatar(file),

    onSuccess: (data) => {

      qc.setQueryData(professionalsKeys.me(), data);

      qc.invalidateQueries({ queryKey: professionalsKeys.all });

      toast.success("Avatar atualizado");

    },

    onError: (e) => toast.error(getApiErrorMessage(e)),

  });

}



export function useCreateProfessionalAccess(professionalId: string) {

  const qc = useQueryClient();

  return useMutation({

    mutationFn: (payload: ProfessionalAccessCreatePayload) =>

      createProfessionalAccess(professionalId, payload),

    onSuccess: (data) => {

      qc.setQueryData(professionalsKeys.detail(professionalId), data);

      qc.invalidateQueries({ queryKey: professionalsKeys.all });

      toast.success("Acesso criado");

    },

    onError: (e) => toast.error(getApiErrorMessage(e)),

  });

}



export function useUpdateProfessionalAccess(professionalId: string) {

  const qc = useQueryClient();

  return useMutation({

    mutationFn: (payload: ProfessionalAccessUpdatePayload) =>

      updateProfessionalAccess(professionalId, payload),

    onSuccess: (data) => {

      qc.setQueryData(professionalsKeys.detail(professionalId), data);

      qc.invalidateQueries({ queryKey: professionalsKeys.all });

      toast.success("Acesso atualizado");

    },

    onError: (e) => toast.error(getApiErrorMessage(e)),

  });

}



export function useDeleteProfessionalAccess(professionalId: string) {

  const qc = useQueryClient();

  return useMutation({

    mutationFn: () => deleteProfessionalAccess(professionalId),

    onSuccess: (data) => {

      qc.setQueryData(professionalsKeys.detail(professionalId), data);

      qc.invalidateQueries({ queryKey: professionalsKeys.all });

      toast.success("Acesso removido");

    },

    onError: (e) => toast.error(getApiErrorMessage(e)),

  });

}



export function useResetProfessionalPassword(professionalId: string) {

  const qc = useQueryClient();

  return useMutation({

    mutationFn: (payload: ProfessionalResetPasswordPayload) =>

      resetProfessionalPassword(professionalId, payload),

    onSuccess: (data) => {

      qc.setQueryData(professionalsKeys.detail(professionalId), data);

      qc.invalidateQueries({ queryKey: professionalsKeys.all });

      toast.success("Senha redefinida");

    },

    onError: (e) => toast.error(getApiErrorMessage(e)),

  });

}

