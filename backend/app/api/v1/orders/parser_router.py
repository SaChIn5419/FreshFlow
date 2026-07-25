from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
import uuid
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.parser import ParseResponse, ParseTextRequest
from app.services.parser_service import ParserService
from app.repositories import ProductRepository

router = APIRouter()

def get_parser_service(db: Session = Depends(deps.get_db)) -> ParserService:
    return ParserService(ProductRepository(db))

@router.post("/parse-pdf", response_model=ParseResponse, tags=["Orders"])
async def parse_pdf_order(
    customer_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    svc: ParserService = Depends(get_parser_service),
    current_user=Depends(deps.get_current_active_admin),
):
    """Parses an uploaded PDF file for order items."""
    try:
        file_bytes = await file.read()
        items = svc.parse_pdf(file_bytes, customer_id)
        return ParseResponse(items=items)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse PDF order: {str(e)}"
        )

@router.post("/parse-text", response_model=ParseResponse, tags=["Orders"])
def parse_text_order(
    data: ParseTextRequest,
    svc: ParserService = Depends(get_parser_service),
    current_user=Depends(deps.get_current_active_admin),
):
    """Parses raw text (e.g. from WhatsApp) for order items."""
    try:
        items = svc.parse_text(data.text, data.customer_id)
        return ParseResponse(items=items)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse text order: {str(e)}"
        )
