from fastapi import APIRouter
from app.core.supabase import get_supabase

router = APIRouter()


@router.get("/health")
async def health_check():
    try:
        supabase = get_supabase()
        supabase.table("teses").select("id").limit(1).execute()
        db_status = "ok"
    except Exception as e:
        db_status = f"erro: {str(e)}"

    return {
        "status": "ok",
        "supabase": db_status,
    }
