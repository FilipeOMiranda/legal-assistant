from fastapi import APIRouter
from app.models.schemas import CategoriasResponse
from app.services.drive_service import listar_categorias
from app.core.config import settings

router = APIRouter()


@router.get("/categorias", response_model=CategoriasResponse)
async def categorias():
    """
    Retorna a lista de subpastas direto-filhas da pasta raiz do Drive.
    Cada subpasta vira uma 'categoria' usada para filtrar a busca.
    """
    nomes = listar_categorias(settings.GOOGLE_DRIVE_FOLDER_ID)
    return CategoriasResponse(categorias=nomes)
