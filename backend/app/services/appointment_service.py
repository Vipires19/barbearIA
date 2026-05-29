import math
import uuid
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, ConflictError, ForbiddenError, NotFoundError
from app.models.appointment import Appointment, AppointmentStatus
from app.models.appointment_item import AppointmentItem
from app.models.professional import Professional
from app.models.professional_availability import ProfessionalAvailability
from app.models.service import Service
from app.models.user import User, UserRole
from app.repositories.appointment_repository import AppointmentRepository, BLOCKING_STATUSES
from app.schemas.appointment import (
    AppointmentCancel,
    AppointmentCreate,
    AppointmentFilters,
    AppointmentItemSummary,
    AppointmentListResponse,
    AppointmentProfessionalSummary,
    AppointmentResponse,
    AppointmentReschedule,
    AppointmentUpdate,
    AvailableSlot,
    AvailableSlotsResponse,
    decimal_to_float,
    normalize_time,
    serialize_time,
)
from app.schemas.public_appointment import (
    PublicAppointmentCancel,
    PublicAppointmentCreate,
    PublicAppointmentItem,
    PublicAppointmentListResponse,
    PublicAppointmentReschedule,
    PublicAppointmentScope,
    PublicAppointmentServiceItem,
    PublicProfessionalSummary,
)
from app.utils.phone import mask_client_display_name, normalize_client_phone

SLOT_STEP_MINUTES = 15


class AppointmentService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = AppointmentRepository(session)

    async def list_appointments(
        self,
        filters: AppointmentFilters,
        current_user: User,
    ) -> AppointmentListResponse:
        self._require_manage(current_user)
        professional_id = filters.professional_id
        if current_user.role == UserRole.barber:
            professional_id = await self._get_barber_professional_id(current_user)
        page = max(1, filters.page)
        page_size = min(max(1, filters.page_size), 100)
        items, total = await self._repo.list_appointments(
            page=page,
            page_size=page_size,
            search=filters.search,
            status=filters.status,
            professional_id=professional_id,
            service_id=filters.service_id,
            date_from=filters.date_from,
            date_to=filters.date_to,
        )
        pages = max(1, math.ceil(total / page_size)) if total else 1
        return AppointmentListResponse(
            items=[self._to_response(a) for a in items],
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    async def get_by_id(self, appointment_id: uuid.UUID, current_user: User) -> AppointmentResponse:
        self._require_manage(current_user)
        appointment = await self._get_or_404(appointment_id)
        await self._assert_ownership_if_barber(current_user, appointment)
        return self._to_response(appointment)

    async def create(self, data: AppointmentCreate, current_user: User) -> AppointmentResponse:
        self._require_manage(current_user)
        created = await self._create_appointment(data)
        return self._to_response(created)

    async def _create_appointment(self, data: AppointmentCreate) -> Appointment:
        services, professional = await self._resolve_services_and_professional(
            data.service_ids,
            data.professional_id,
        )
        total_duration = sum(s.duration_minutes for s in services)
        total_price = sum(s.price for s in services)
        start_time = normalize_time(data.start_time)
        end_time = self._add_minutes(data.appointment_date, start_time, total_duration)
        await self._validate_slot(
            services=services,
            professional=professional,
            appointment_date=data.appointment_date,
            start_time=start_time,
            end_time=end_time,
        )
        appointment = Appointment(
            client_name=data.client_name.strip(),
            client_phone=data.client_phone.strip(),
            client_email=str(data.client_email) if data.client_email else None,
            professional_id=professional.id,
            appointment_date=data.appointment_date,
            start_time=start_time,
            end_time=end_time,
            total_duration_minutes=total_duration,
            total_price=total_price,
            status=AppointmentStatus.scheduled,
            notes=data.notes,
        )
        appointment.items = [
            AppointmentItem(
                service_id=s.id,
                duration_minutes=s.duration_minutes,
                price=s.price,
                position=index,
            )
            for index, s in enumerate(services)
        ]
        return await self._repo.create(appointment)

    async def update(
        self,
        appointment_id: uuid.UUID,
        data: AppointmentUpdate,
        current_user: User,
    ) -> AppointmentResponse:
        self._require_manage(current_user)
        appointment = await self._get_or_404(appointment_id)
        await self._assert_ownership_if_barber(current_user, appointment)
        payload = data.model_dump(exclude_unset=True)
        if "client_email" in payload and payload["client_email"] is not None:
            payload["client_email"] = str(payload["client_email"])
        if "status" in payload:
            next_status = payload["status"]
            if next_status is not None:
                current_status = self._coerce_appointment_status(appointment.status)
                next_status = self._coerce_appointment_status(next_status)
                self._validate_status_transition(current_status, next_status)
                payload["status"] = next_status
        updated = await self._repo.update(appointment, **payload)
        return self._to_response(updated)

    async def cancel(
        self,
        appointment_id: uuid.UUID,
        data: AppointmentCancel,
        current_user: User,
    ) -> AppointmentResponse:
        self._require_manage(current_user)
        appointment = await self._get_or_404(appointment_id)
        await self._assert_ownership_if_barber(current_user, appointment)
        if appointment.status in (AppointmentStatus.completed, AppointmentStatus.cancelled, AppointmentStatus.no_show):
            raise AppError("Atendimento finalizado não pode ser cancelado", status_code=400)
        updated = await self._repo.update(
            appointment,
            status=AppointmentStatus.cancelled,
            notes=data.notes if data.notes is not None else appointment.notes,
        )
        return self._to_response(updated)

    async def reschedule(
        self,
        appointment_id: uuid.UUID,
        data: AppointmentReschedule,
        current_user: User,
    ) -> AppointmentResponse:
        self._require_manage(current_user)
        appointment = await self._get_or_404(appointment_id)
        await self._assert_ownership_if_barber(current_user, appointment)
        if appointment.status not in BLOCKING_STATUSES:
            raise AppError("Apenas agendamentos ativos podem ser reagendados", status_code=400)

        professional_id = data.professional_id or appointment.professional_id
        service_ids = [item.service_id for item in appointment.items]
        services, professional = await self._resolve_services_and_professional(
            service_ids,
            professional_id,
        )
        start_time = normalize_time(data.start_time)
        end_time = self._add_minutes(data.appointment_date, start_time, appointment.total_duration_minutes)
        await self._validate_slot(
            services=services,
            professional=professional,
            appointment_date=data.appointment_date,
            start_time=start_time,
            end_time=end_time,
            exclude_id=appointment.id,
        )
        updated = await self._repo.update(
            appointment,
            professional_id=professional.id,
            appointment_date=data.appointment_date,
            start_time=start_time,
            end_time=end_time,
        )
        return self._to_response(updated)

    async def public_create(self, data: PublicAppointmentCreate) -> PublicAppointmentItem:
        created = await self._create_appointment(AppointmentCreate(**data.model_dump()))
        return self._to_public_item(created)

    async def public_list_by_phone(
        self,
        *,
        phone: str,
        scope: PublicAppointmentScope = PublicAppointmentScope.all,
    ) -> PublicAppointmentListResponse:
        normalized = normalize_client_phone(phone)
        rows = await self._repo.list_public_by_phone(normalized_phone=normalized, scope=None, limit=100)
        upcoming_raw = [a for a in rows if self._is_upcoming_client(a)]
        past_raw = [a for a in rows if not self._is_upcoming_client(a)]
        past_sorted = sorted(past_raw, key=lambda a: (a.appointment_date, a.start_time), reverse=True)
        upcoming = [self._to_public_item(a) for a in upcoming_raw]
        past = [self._to_public_item(a) for a in past_sorted]
        if scope == PublicAppointmentScope.upcoming:
            items = upcoming
        elif scope == PublicAppointmentScope.past:
            items = past
        else:
            items = [self._to_public_item(a) for a in rows]
        return PublicAppointmentListResponse(items=items, upcoming=upcoming, past=past)

    async def public_get_by_phone(self, appointment_id: uuid.UUID, *, phone: str) -> PublicAppointmentItem:
        normalized = normalize_client_phone(phone)
        appointment = await self._repo.get_by_id_for_public(appointment_id, normalized_phone=normalized)
        if appointment is None:
            raise NotFoundError("Agendamento não encontrado")
        return self._to_public_item(appointment)

    async def public_cancel(self, appointment_id: uuid.UUID, data: PublicAppointmentCancel) -> PublicAppointmentItem:
        normalized = normalize_client_phone(data.phone)
        appointment = await self._repo.get_by_id_for_public(appointment_id, normalized_phone=normalized)
        if appointment is None:
            raise NotFoundError("Agendamento não encontrado")
        if appointment.status == AppointmentStatus.cancelled:
            raise AppError("Agendamento já cancelado", status_code=400)
        if appointment.status == AppointmentStatus.completed:
            raise AppError("Não é possível cancelar atendimento concluído", status_code=400)
        notes = appointment.notes
        if data.notes is not None and data.notes.strip():
            notes = data.notes.strip()
        updated = await self._repo.update(
            appointment,
            status=AppointmentStatus.cancelled,
            notes=notes,
        )
        return self._to_public_item(updated)

    async def public_reschedule(
        self,
        appointment_id: uuid.UUID,
        data: PublicAppointmentReschedule,
    ) -> PublicAppointmentItem:
        normalized = normalize_client_phone(data.phone)
        appointment = await self._repo.get_by_id_for_public(appointment_id, normalized_phone=normalized)
        if appointment is None:
            raise NotFoundError("Agendamento não encontrado")
        if appointment.status not in BLOCKING_STATUSES:
            raise AppError("Apenas agendamentos ativos podem ser reagendados", status_code=400)

        professional_id = data.professional_id or appointment.professional_id
        service_ids = [item.service_id for item in appointment.items]
        services, professional = await self._resolve_services_and_professional(
            service_ids,
            professional_id,
        )
        start_time = normalize_time(data.start_time)
        end_time = self._add_minutes(data.appointment_date, start_time, appointment.total_duration_minutes)
        await self._validate_slot(
            services=services,
            professional=professional,
            appointment_date=data.appointment_date,
            start_time=start_time,
            end_time=end_time,
            exclude_id=appointment.id,
        )
        updated = await self._repo.update(
            appointment,
            professional_id=professional.id,
            appointment_date=data.appointment_date,
            start_time=start_time,
            end_time=end_time,
        )
        return self._to_public_item(updated)

    async def list_available_slots(
        self,
        *,
        professional_id: uuid.UUID,
        service_ids: list[uuid.UUID],
        appointment_date: date,
    ) -> AvailableSlotsResponse:
        services, professional = await self._resolve_services_and_professional(
            service_ids,
            professional_id,
        )
        total_duration = sum(s.duration_minutes for s in services)
        slots: list[AvailableSlot] = []
        windows = await self._repo.list_active_availabilities_for_weekday(
            professional_id=professional.id,
            weekday=appointment_date.weekday(),
        )
        if not windows:
            return AvailableSlotsResponse(
                professional_id=professional.id,
                service_ids=service_ids,
                date=appointment_date,
                duration_minutes=total_duration,
                slots=[],
            )

        appointments = await self._repo.list_day_blocking_appointments(
            professional_id=professional.id,
            appointment_date=appointment_date,
        )
        blocks = await self._repo.list_schedule_blocks_for_day(
            professional_id=professional.id,
            block_date=appointment_date,
        )

        for window in windows:
            slots.extend(
                self._slots_for_window(
                    appointment_date=appointment_date,
                    window=window,
                    duration_minutes=total_duration,
                    appointments=appointments,
                    blocks=blocks,
                )
            )

        slots.sort(key=lambda s: s.start_time)
        deduped: list[AvailableSlot] = []
        seen: set[str] = set()
        for slot in slots:
            if slot.start_time not in seen:
                seen.add(slot.start_time)
                deduped.append(slot)

        return AvailableSlotsResponse(
            professional_id=professional.id,
            service_ids=service_ids,
            date=appointment_date,
            duration_minutes=total_duration,
            slots=deduped,
        )

    def _slots_for_window(
        self,
        *,
        appointment_date: date,
        window: ProfessionalAvailability,
        duration_minutes: int,
        appointments: list[Appointment],
        blocks: list | None = None,
    ) -> list[AvailableSlot]:
        slots: list[AvailableSlot] = []
        block_rows = blocks or []
        current = window.start_time
        while True:
            end_time = self._add_minutes(appointment_date, current, duration_minutes)
            if end_time <= current or end_time > window.end_time:
                break
            if (
                not self._is_past_slot(appointment_date, current)
                and not self._has_local_conflict(current, end_time, appointments)
                and not self._has_local_conflict(current, end_time, block_rows)
            ):
                slots.append(
                    AvailableSlot(
                        start_time=serialize_time(current),
                        end_time=serialize_time(end_time),
                    )
                )
            current = self._add_minutes(appointment_date, current, SLOT_STEP_MINUTES)
        return slots

    async def _resolve_services_and_professional(
        self,
        service_ids: list[uuid.UUID],
        professional_id: uuid.UUID,
    ) -> tuple[list[Service], Professional]:
        services = await self._repo.get_services(service_ids)
        if len(services) != len(set(service_ids)):
            raise NotFoundError("Serviço não encontrado")
        inactive = [s for s in services if not s.is_active]
        if inactive:
            raise NotFoundError("Serviço não encontrado")

        professional = await self._repo.get_professional(professional_id)
        if professional is None or not professional.is_active:
            raise NotFoundError("Profissional não encontrado")

        professional_service_ids = {s.id for s in professional.services}
        for service in services:
            if service.id not in professional_service_ids:
                raise AppError("Profissional não atende este serviço", status_code=400)

        order = {sid: index for index, sid in enumerate(service_ids)}
        services.sort(key=lambda s: order[s.id])
        return services, professional

    async def _validate_slot(
        self,
        *,
        services: list[Service],
        professional: Professional,
        appointment_date: date,
        start_time: time,
        end_time: time,
        exclude_id: uuid.UUID | None = None,
    ) -> None:
        windows = await self._repo.list_active_availabilities_for_weekday(
            professional_id=professional.id,
            weekday=appointment_date.weekday(),
        )
        if not windows:
            raise AppError("Profissional não atende neste dia", status_code=400)
        if self._is_past_slot(appointment_date, start_time):
            raise AppError("Não é possível agendar horários passados", status_code=400)
        if end_time <= start_time:
            raise AppError("Horário final inválido para a duração do serviço", status_code=400)
        if not self._fits_availability(start_time, end_time, windows):
            raise AppError("Horário fora da disponibilidade do profissional", status_code=400)
        if await self._repo.has_conflict(
            professional_id=professional.id,
            appointment_date=appointment_date,
            start_time=start_time,
            end_time=end_time,
            exclude_id=exclude_id,
        ):
            raise ConflictError("Horário indisponível para este profissional")
        if await self._repo.has_schedule_block_conflict(
            professional_id=professional.id,
            block_date=appointment_date,
            start_time=start_time,
            end_time=end_time,
        ):
            raise ConflictError("Horário bloqueado pelo profissional")
        if any(s.duration_minutes <= 0 for s in services):
            raise AppError("Serviço sem duração válida", status_code=400)

    async def _get_or_404(self, appointment_id: uuid.UUID) -> Appointment:
        appointment = await self._repo.get_by_id(appointment_id)
        if appointment is None:
            raise NotFoundError("Agendamento não encontrado")
        return appointment

    async def _get_barber_professional_id(self, current_user: User) -> uuid.UUID:
        professional = await self._repo.get_professional_by_user_id(current_user.id)
        if professional is None or not professional.is_active:
            raise ForbiddenError("Barbeiro sem perfil profissional vinculado")
        return professional.id

    async def _assert_ownership_if_barber(self, current_user: User, appointment: Appointment) -> None:
        if current_user.role != UserRole.barber:
            return
        professional_id = await self._get_barber_professional_id(current_user)
        if appointment.professional_id != professional_id:
            raise ForbiddenError("Sem permissão para acessar este agendamento")

    @staticmethod
    def _fits_availability(start_time: time, end_time: time, windows: list[ProfessionalAvailability]) -> bool:
        return any(w.start_time <= start_time and w.end_time >= end_time for w in windows)

    @staticmethod
    def _coerce_appointment_status(value: AppointmentStatus | str) -> AppointmentStatus:
        if isinstance(value, AppointmentStatus):
            return value
        return AppointmentStatus(str(value))

    @staticmethod
    def _validate_status_transition(current: AppointmentStatus, nxt: AppointmentStatus) -> None:
        if current == nxt:
            return

        if current in (AppointmentStatus.completed, AppointmentStatus.cancelled, AppointmentStatus.no_show):
            raise AppError("Status finalizado não pode ser alterado", status_code=400)

        if current in (AppointmentStatus.scheduled, AppointmentStatus.confirmed) and nxt in (
            AppointmentStatus.completed,
            AppointmentStatus.cancelled,
            AppointmentStatus.no_show,
        ):
            return

        raise AppError("Transição de status inválida", status_code=400)

    @staticmethod
    def _is_upcoming_client(appointment: Appointment) -> bool:
        if appointment.status not in BLOCKING_STATUSES:
            return False
        now = datetime.now()
        today = now.date()
        now_time = now.time()
        if appointment.appointment_date > today:
            return True
        if appointment.appointment_date < today:
            return False
        return appointment.start_time > now_time

    @staticmethod
    def _to_public_item(appointment: Appointment) -> PublicAppointmentItem:
        return PublicAppointmentItem(
            id=appointment.id,
            service_ids=[item.service_id for item in appointment.items],
            professional_id=appointment.professional_id,
            client_display_name=mask_client_display_name(appointment.client_name),
            services=[
                PublicAppointmentServiceItem(
                    name=item.service.name,
                    duration_minutes=item.duration_minutes,
                )
                for item in appointment.items
            ],
            professional=PublicProfessionalSummary(name=appointment.professional.name),
            appointment_date=appointment.appointment_date,
            start_time=serialize_time(appointment.start_time),
            end_time=serialize_time(appointment.end_time),
            total_duration_minutes=appointment.total_duration_minutes,
            status=appointment.status,
        )

    @staticmethod
    def _to_response(appointment: Appointment) -> AppointmentResponse:
        return AppointmentResponse(
            id=appointment.id,
            client_name=appointment.client_name,
            client_phone=appointment.client_phone,
            client_email=appointment.client_email,
            professional_id=appointment.professional_id,
            appointment_date=appointment.appointment_date,
            start_time=serialize_time(appointment.start_time),
            end_time=serialize_time(appointment.end_time),
            total_duration_minutes=appointment.total_duration_minutes,
            total_price=decimal_to_float(appointment.total_price),
            status=appointment.status,
            notes=appointment.notes,
            items=[
                AppointmentItemSummary(
                    id=item.id,
                    service_id=item.service_id,
                    service_name=item.service.name,
                    duration_minutes=item.duration_minutes,
                    price=decimal_to_float(item.price),
                    position=item.position,
                )
                for item in appointment.items
            ],
            professional=AppointmentProfessionalSummary.model_validate(appointment.professional),
            created_at=appointment.created_at,
            updated_at=appointment.updated_at,
        )

    @staticmethod
    def _add_minutes(slot_date: date, slot_time: time, minutes: int) -> time:
        return (datetime.combine(slot_date, slot_time) + timedelta(minutes=minutes)).time()

    @staticmethod
    def _is_past_slot(appointment_date: date, start_time: time) -> bool:
        return datetime.combine(appointment_date, start_time) <= datetime.now()

    @staticmethod
    def _has_local_conflict(start_time: time, end_time: time, appointments: list[Appointment]) -> bool:
        return any(a.start_time < end_time and a.end_time > start_time for a in appointments)

    @staticmethod
    def _require_manage(user: User) -> None:
        if user.role not in (UserRole.admin, UserRole.barber):
            raise ForbiddenError("Sem permissão para gerenciar agendamentos")
