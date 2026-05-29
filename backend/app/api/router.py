from fastapi import APIRouter

from app.api.v1 import appointments, auth, financial, health, inventory, professionals, public_appointments, services, users

api_router = APIRouter()
api_router.include_router(health.router, prefix="/v1")
api_router.include_router(auth.router, prefix="/v1")
api_router.include_router(users.router, prefix="/v1")
# Agendamentos antes de demais routers de domínio (evita qualquer ambiguidade em deploys antigos)
api_router.include_router(appointments.router, prefix="/v1")
api_router.include_router(public_appointments.router, prefix="/v1")
api_router.include_router(services.router, prefix="/v1")
api_router.include_router(professionals.router, prefix="/v1")
api_router.include_router(financial.router, prefix="/v1")
api_router.include_router(inventory.router, prefix="/v1")