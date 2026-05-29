import math
import uuid
from datetime import date
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import Settings
from app.core.exceptions import AppError, ConflictError, ForbiddenError, NotFoundError
from app.models.professional import Professional
from app.models.professional_availability import ProfessionalAvailability
from app.models.professional_schedule_block import ProfessionalScheduleBlock
from app.models.user import User, UserRole
from app.repositories.professional_repository import ProfessionalRepository
from app.repositories.user_repository import UserRepository
from app.schemas.schedule_block import ScheduleBlockCreate, ScheduleBlockResponse
from app.schemas.professional import (
    AvailabilityTimeBlock,
    ProfessionalAccessCreate,
    ProfessionalAccessUpdate,
    ProfessionalAdminUpdate,
    ProfessionalAvailabilityCreate,
    ProfessionalAvailabilityResponse,
    ProfessionalAvailabilityUpdate,
    ProfessionalCreate,
    ProfessionalCreateResponse,
    ProfessionalListResponse,
    ProfessionalProfileUpdate,
    ProfessionalResetPassword,
    ProfessionalResponse,
    ServiceSummary,
    WeekdayAvailabilityInput,
    WeekdayAvailabilityResponse,
    format_time,
)
from app.utils.file_storage import FileStorageService
from app.utils.security import generate_temporary_password, hash_password
class ProfessionalService:
    def __init__(self, session: AsyncSession, settings: Settings) -> None:
        self._session = session
        self._repo = ProfessionalRepository(session)
        self._users = UserRepository(session)
        self._storage = FileStorageService(settings)
    async def list_professionals(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        is_active: bool | None = None,
        service_id: uuid.UUID | None = None,
        current_user: User | None = None,
    ) -> ProfessionalListResponse:
        page = max(1, page)
        page_size = min(max(1, page_size), 100)
        effective_active = is_active
        is_publicly_visible = None
        if current_user is None:
            effective_active = True
            is_publicly_visible = True
        if current_user is not None and current_user.role == UserRole.barber:
            items, _total = await self._repo.list_professionals(
                page=1,
                page_size=100,
                search=None,
                is_active=True,
                service_id=None,
            )
            own_items = [p for p in items if p.user_id == current_user.id]
            return ProfessionalListResponse(
                items=[self._to_response(p) for p in own_items],
                total=len(own_items),
                page=1,
                page_size=page_size,
                pages=1,
            )
        items, total = await self._repo.list_professionals(
            page=page,
            page_size=page_size,
            search=search,
            is_active=effective_active,
            is_publicly_visible=is_publicly_visible,
            service_id=service_id,
        )
        pages = max(1, math.ceil(total / page_size)) if total else 1
        return ProfessionalListResponse(
            items=[self._to_response(p) for p in items],
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )
    async def get_by_id(
        self,
        professional_id: uuid.UUID,
        current_user: User | None = None,
    ) -> ProfessionalResponse:
        professional = await self._repo.get_by_id(professional_id)
        if professional is None:
            raise NotFoundError("Profissional não encontrado")
        if current_user is not None and current_user.role == UserRole.barber and professional.user_id != current_user.id:
            raise ForbiddenError("Sem permissão para acessar este profissional")
        if not professional.is_active and not self._can_manage(current_user):
            raise NotFoundError("Profissional não encontrado")
        return self._to_response(professional)
    async def get_my_profile(self, current_user: User) -> ProfessionalResponse:
        professional = await self._repo.get_by_user_id(current_user.id)
        if professional is None:
            raise NotFoundError("Perfil profissional não encontrado")
        return self._to_response(professional)
    async def create(self, data: ProfessionalCreate, current_user: User) -> ProfessionalCreateResponse:
        self._require_manage(current_user)
        professional = await self._repo.create(
            name=data.name.strip(),
            is_active=data.is_active,
        )
        plain_password = data.login_password or generate_temporary_password()
        auto_generated = data.login_password is None
        await self._link_barber_account(
            professional,
            str(data.login_email),
            plain_password,
            is_active=data.is_active,
        )
        refreshed = await self._repo.get_by_id(professional.id)
        if refreshed is None:
            raise NotFoundError("Profissional não encontrado")
        base = self._to_response(refreshed)
        return ProfessionalCreateResponse(
            **base.model_dump(),
            temporary_password=plain_password if auto_generated else None,
        )
    async def update_admin(
        self,
        professional_id: uuid.UUID,
        data: ProfessionalAdminUpdate,
        current_user: User,
    ) -> ProfessionalResponse:
        self._require_manage(current_user)
        professional = await self._get_or_404(professional_id)
        payload = data.model_dump(exclude_unset=True)
        updated = await self._repo.update(professional, **payload)
        if "is_active" in payload and updated.user_id is not None:
            user = await self._users.get_by_id(updated.user_id)
            if user is not None:
                user.is_active = bool(payload["is_active"])
        return self._to_response(updated)
    async def update_profile(
        self,
        professional_id: uuid.UUID,
        data: ProfessionalProfileUpdate,
        current_user: User,
    ) -> ProfessionalResponse:
        professional = await self._get_or_404(professional_id)
        self._assert_profile_access(current_user, professional)
        payload = data.model_dump(exclude_unset=True)
        service_ids = payload.pop("service_ids", None)
        update_fields: dict[str, object] = dict(payload)
        if service_ids is not None:
            update_fields["services"] = await self._resolve_services(service_ids)
        updated = await self._repo.update(professional, **update_fields)
        return self._to_response(updated)
    async def update_my_profile(self, data: ProfessionalProfileUpdate, current_user: User) -> ProfessionalResponse:
        professional = await self._repo.get_by_user_id(current_user.id)
        if professional is None:
            raise NotFoundError("Perfil profissional não encontrado")
        return await self.update_profile(professional.id, data, current_user)
    async def create_access(
        self,
        professional_id: uuid.UUID,
        data: ProfessionalAccessCreate,
        current_user: User,
    ) -> ProfessionalResponse:
        self._require_manage(current_user)
        professional = await self._get_or_404(professional_id)
        await self._link_barber_account(
            professional,
            str(data.email),
            data.password,
            is_active=professional.is_active,
        )
        refreshed = await self._repo.get_by_id(professional_id)
        if refreshed is None:
            raise NotFoundError("Profissional não encontrado")
        return self._to_response(refreshed)
    async def update_access(
        self,
        professional_id: uuid.UUID,
        data: ProfessionalAccessUpdate,
        current_user: User,
    ) -> ProfessionalResponse:
        self._require_manage(current_user)
        professional = await self._get_or_404(professional_id)
        if professional.user_id is None:
            raise NotFoundError("Profissional sem login vinculado")
        user = await self._users.get_by_id(professional.user_id)
        if user is None:
            raise NotFoundError("Usuário não encontrado")
        if data.email is not None:
            existing = await self._users.get_by_email(data.email)
            if existing is not None and existing.id != user.id:
                raise ConflictError("E-mail já cadastrado")
            user.email = data.email
        if data.is_active is not None:
            user.is_active = data.is_active
            professional.is_active = data.is_active
        await self._session.flush()
        refreshed = await self._repo.get_by_id(professional_id)
        if refreshed is None:
            raise NotFoundError("Profissional não encontrado")
        return self._to_response(refreshed)
    async def delete_access(self, professional_id: uuid.UUID, current_user: User) -> ProfessionalResponse:
        self._require_manage(current_user)
        professional = await self._get_or_404(professional_id)
        if professional.user_id is None:
            raise NotFoundError("Profissional sem login vinculado")
        user = await self._users.get_by_id(professional.user_id)
        if user is not None:
            user.is_active = False
        cleared = await self._repo.clear_user_link(professional)
        return self._to_response(cleared)
    async def reset_access_password(
        self,
        professional_id: uuid.UUID,
        data: ProfessionalResetPassword,
        current_user: User,
    ) -> ProfessionalResponse:
        self._require_manage(current_user)
        professional = await self._get_or_404(professional_id)
        if professional.user_id is None:
            raise AppError("Profissional sem login vinculado", status_code=400)
        user = await self._users.get_by_id(professional.user_id)
        if user is None:
            raise NotFoundError("Usuário não encontrado")
        user.password_hash = hash_password(data.new_password)
        await self._session.flush()
        refreshed = await self._repo.get_by_id(professional_id)
        if refreshed is None:
            raise NotFoundError("Profissional não encontrado")
        return self._to_response(refreshed)
    async def delete(self, professional_id: uuid.UUID, current_user: User) -> None:
        self._require_manage(current_user)
        professional = await self._get_or_404(professional_id)
        self._storage.delete_by_url(professional.avatar_url)
        await self._repo.delete(professional)
    async def upload_avatar(
        self,
        professional_id: uuid.UUID,
        file: UploadFile,
        current_user: User,
    ) -> ProfessionalResponse:
        professional = await self._get_or_404(professional_id)
        self._assert_profile_access(current_user, professional)
        if professional.avatar_url:
            self._storage.delete_by_url(professional.avatar_url)
        avatar_url = await self._storage.save_professional_avatar(file)
        updated = await self._repo.update(professional, avatar_url=avatar_url)
        return self._to_response(updated)
    async def upload_my_avatar(self, file: UploadFile, current_user: User) -> ProfessionalResponse:
        professional = await self._repo.get_by_user_id(current_user.id)
        if professional is None:
            raise NotFoundError("Perfil profissional não encontrado")
        return await self.upload_avatar(professional.id, file, current_user)
    async def list_availabilities(
        self,
        professional_id: uuid.UUID,
        current_user: User,
    ) -> list[ProfessionalAvailabilityResponse]:
        professional = await self._get_or_404(professional_id)
        self._assert_profile_access(current_user, professional)
        rows = await self._repo.list_availabilities(professional_id)
        return [self._availability_to_response(r) for r in rows]
    async def create_availability(
        self,
        professional_id: uuid.UUID,
        data: ProfessionalAvailabilityCreate,
        current_user: User,
    ) -> ProfessionalAvailabilityResponse:
        professional = await self._get_or_404(professional_id)
        self._assert_profile_access(current_user, professional)
        row = await self._repo.create_availability(
            professional_id=professional_id,
            weekday=data.weekday,
            start_time=data.start_time,
            end_time=data.end_time,
            active=data.active,
        )
        return self._availability_to_response(row)
    async def update_availability(
        self,
        professional_id: uuid.UUID,
        availability_id: uuid.UUID,
        data: ProfessionalAvailabilityUpdate,
        current_user: User,
    ) -> ProfessionalAvailabilityResponse:
        professional = await self._get_or_404(professional_id)
        self._assert_profile_access(current_user, professional)
        row = await self._repo.get_availability_by_id(availability_id, professional_id)
        if row is None:
            raise NotFoundError("Disponibilidade não encontrada")
        payload = data.model_dump(exclude_unset=True)
        from app.schemas.professional import parse_time_str

        start = payload.get("start_time", format_time(row.start_time))
        end = payload.get("end_time", format_time(row.end_time))
        if parse_time_str(start) >= parse_time_str(end):
            raise AppError("start_time deve ser anterior a end_time", status_code=400)
        updated = await self._repo.update_availability(row, **payload)
        return self._availability_to_response(updated)
    async def delete_availability(
        self,
        professional_id: uuid.UUID,
        availability_id: uuid.UUID,
        current_user: User,
    ) -> None:
        professional = await self._get_or_404(professional_id)
        self._assert_profile_access(current_user, professional)
        row = await self._repo.get_availability_by_id(availability_id, professional_id)
        if row is None:
            raise NotFoundError("Disponibilidade não encontrada")
        await self._repo.delete_availability(row)

    async def get_grouped_availabilities(
        self,
        professional_id: uuid.UUID,
        current_user: User,
    ) -> list[WeekdayAvailabilityResponse]:
        professional = await self._get_or_404(professional_id)
        self._assert_profile_access(current_user, professional)
        rows = await self._repo.list_availabilities(professional_id)
        return self._group_availabilities(rows)

    async def get_my_grouped_availabilities(self, current_user: User) -> list[WeekdayAvailabilityResponse]:
        professional = await self._repo.get_by_user_id(current_user.id)
        if professional is None:
            raise NotFoundError("Perfil profissional não encontrado")
        rows = await self._repo.list_availabilities(professional.id)
        return self._group_availabilities(rows)

    async def replace_grouped_availabilities(
        self,
        professional_id: uuid.UUID,
        data: list[WeekdayAvailabilityInput],
        current_user: User,
    ) -> list[WeekdayAvailabilityResponse]:
        professional = await self._get_or_404(professional_id)
        self._assert_profile_access(current_user, professional)
        entries = self._flatten_weekday_inputs(data)
        rows = await self._repo.replace_availabilities(professional_id, entries=entries)
        return self._group_availabilities(rows)

    async def replace_my_grouped_availabilities(
        self,
        data: list[WeekdayAvailabilityInput],
        current_user: User,
    ) -> list[WeekdayAvailabilityResponse]:
        professional = await self._repo.get_by_user_id(current_user.id)
        if professional is None:
            raise NotFoundError("Perfil profissional não encontrado")
        return await self.replace_grouped_availabilities(professional.id, data, current_user)

    @staticmethod
    def _group_availabilities(rows: list[ProfessionalAvailability]) -> list[WeekdayAvailabilityResponse]:
        by_weekday: dict[int, list[AvailabilityTimeBlock]] = {d: [] for d in range(7)}
        active_days: set[int] = set()
        for row in rows:
            if not row.active:
                continue
            active_days.add(row.weekday)
            by_weekday[row.weekday].append(
                AvailabilityTimeBlock(
                    start_time=format_time(row.start_time),
                    end_time=format_time(row.end_time),
                )
            )
        result: list[WeekdayAvailabilityResponse] = []
        for weekday in range(7):
            blocks = sorted(by_weekday[weekday], key=lambda b: b.start_time)
            result.append(
                WeekdayAvailabilityResponse(
                    weekday=weekday,
                    active=weekday in active_days,
                    blocks=blocks,
                )
            )
        return result

    @staticmethod
    def _flatten_weekday_inputs(data: list[WeekdayAvailabilityInput]) -> list[dict[str, object]]:
        if len(data) != 7:
            raise AppError("Informe os 7 dias da semana (weekday 0 a 6)", status_code=400)
        entries: list[dict[str, object]] = []
        seen_weekdays: set[int] = set()
        for day in data:
            if day.weekday in seen_weekdays:
                raise AppError("weekday duplicado no payload", status_code=400)
            seen_weekdays.add(day.weekday)
            if not day.active:
                continue
            for block in day.blocks:
                entries.append(
                    {
                        "weekday": day.weekday,
                        "start_time": block.start_time,
                        "end_time": block.end_time,
                        "active": True,
                    }
                )
        if seen_weekdays != set(range(7)):
            raise AppError("weekday deve ir de 0 (segunda) a 6 (domingo)", status_code=400)
        return entries

    async def list_schedule_blocks(
        self,
        professional_id: uuid.UUID,
        block_date: date,
        current_user: User,
    ) -> list[ScheduleBlockResponse]:
        professional = await self._get_or_404(professional_id)
        self._assert_profile_access(current_user, professional)
        rows = await self._repo.list_schedule_blocks_for_date(professional_id, block_date)
        return [self._block_to_response(r) for r in rows]

    async def list_my_schedule_blocks(self, block_date: date, current_user: User) -> list[ScheduleBlockResponse]:
        professional = await self._repo.get_by_user_id(current_user.id)
        if professional is None:
            raise NotFoundError("Perfil profissional não encontrado")
        return await self.list_schedule_blocks(professional.id, block_date, current_user)

    async def create_schedule_block(
        self,
        professional_id: uuid.UUID,
        data: ScheduleBlockCreate,
        current_user: User,
    ) -> ScheduleBlockResponse:
        professional = await self._get_or_404(professional_id)
        self._assert_profile_access(current_user, professional)
        row = await self._repo.create_schedule_block(
            professional_id=professional_id,
            block_date=data.block_date,
            start_time=data.start_time,
            end_time=data.end_time,
            reason=data.reason,
        )
        return self._block_to_response(row)

    async def create_my_schedule_block(
        self, data: ScheduleBlockCreate, current_user: User
    ) -> ScheduleBlockResponse:
        professional = await self._repo.get_by_user_id(current_user.id)
        if professional is None:
            raise NotFoundError("Perfil profissional não encontrado")
        return await self.create_schedule_block(professional.id, data, current_user)

    async def delete_schedule_block(
        self,
        professional_id: uuid.UUID,
        block_id: uuid.UUID,
        current_user: User,
    ) -> None:
        professional = await self._get_or_404(professional_id)
        self._assert_profile_access(current_user, professional)
        row = await self._repo.get_schedule_block_by_id(block_id, professional_id)
        if row is None:
            raise NotFoundError("Bloqueio não encontrado")
        await self._repo.delete_schedule_block(row)

    async def delete_my_schedule_block(self, block_id: uuid.UUID, current_user: User) -> None:
        professional = await self._repo.get_by_user_id(current_user.id)
        if professional is None:
            raise NotFoundError("Perfil profissional não encontrado")
        await self.delete_schedule_block(professional.id, block_id, current_user)

    @staticmethod
    def _block_to_response(row: ProfessionalScheduleBlock) -> ScheduleBlockResponse:
        return ScheduleBlockResponse(
            id=row.id,
            professional_id=row.professional_id,
            block_date=row.block_date,
            start_time=format_time(row.start_time),
            end_time=format_time(row.end_time),
            reason=row.reason,
        )

    async def _link_barber_account(
        self,
        professional: Professional,
        email: str,
        password: str,
        *,
        is_active: bool = True,
    ) -> None:
        if professional.user_id is not None:
            raise ConflictError("Profissional já possui login vinculado")
        existing = await self._users.get_by_email(email)
        if existing is None:
            user = User(
                name=professional.name.strip(),
                email=email,
                password_hash=hash_password(password),
                role=UserRole.barber,
                is_active=is_active,
            )
            created = await self._users.create(user)
            await self._repo.update(professional, user_id=created.id)
            return
        if existing.role == UserRole.admin:
            if password:
                existing.password_hash = hash_password(password)
            if is_active is not None:
                existing.is_active = is_active
            await self._repo.update(professional, user_id=existing.id)
            return
        if existing.role == UserRole.barber:
            raise ConflictError("Usuário já cadastrado")
        raise ConflictError("E-mail já cadastrado")
    async def _resolve_services(self, service_ids: list[uuid.UUID]) -> list:
        services = await self._repo.get_services_by_ids(service_ids)
        if len(services) != len(set(service_ids)):
            raise AppError("Um ou mais serviços informados não existem", status_code=400)
        return services
    async def _get_or_404(self, professional_id: uuid.UUID) -> Professional:
        professional = await self._repo.get_by_id(professional_id)
        if professional is None:
            raise NotFoundError("Profissional não encontrado")
        return professional
    @staticmethod
    def _availability_to_response(row: ProfessionalAvailability) -> ProfessionalAvailabilityResponse:
        return ProfessionalAvailabilityResponse(
            id=row.id,
            professional_id=row.professional_id,
            weekday=row.weekday,
            start_time=format_time(row.start_time),
            end_time=format_time(row.end_time),
            active=row.active,
        )
    @staticmethod
    def _to_response(professional: Professional) -> ProfessionalResponse:
        login_email = professional.user.email if professional.user else None
        login_is_active = professional.user.is_active if professional.user else None
        return ProfessionalResponse(
            id=professional.id,
            name=professional.name,
            bio=professional.bio,
            avatar_url=professional.avatar_url,
            specialties=professional.specialties or [],
            is_active=professional.is_active,
            is_publicly_visible=professional.is_publicly_visible,
            participation_percentage=float(professional.participation_percentage),
            active_for_distribution=professional.active_for_distribution,
            user_id=professional.user_id,
            login_email=login_email,
            login_is_active=login_is_active,
            services=[ServiceSummary.model_validate(s) for s in professional.services],
            availabilities=[
                ProfessionalAvailabilityResponse(
                    id=a.id,
                    professional_id=a.professional_id,
                    weekday=a.weekday,
                    start_time=format_time(a.start_time),
                    end_time=format_time(a.end_time),
                    active=a.active,
                )
                for a in (professional.availabilities or [])
            ],
            created_at=professional.created_at,
            updated_at=professional.updated_at,
        )
    @staticmethod
    def _can_manage(user: User | None) -> bool:
        return user is not None and user.role == UserRole.admin
    @staticmethod
    def _require_manage(user: User) -> None:
        if user.role != UserRole.admin:
            raise ForbiddenError("Sem permissão para gerenciar profissionais")
    @staticmethod
    def _assert_profile_access(user: User, professional: Professional) -> None:
        if user.role == UserRole.admin:
            return
        if user.role == UserRole.barber and professional.user_id == user.id:
            return
        raise ForbiddenError("Sem permissão para editar este perfil")
