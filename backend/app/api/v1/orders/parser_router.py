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
        max_size = 10 * 1024 * 1024  # 10MB

        if file.size and file.size > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds maximum limit of 10MB",
            )

        chunks = []
        total_bytes = 0
        header_checked = False

        while chunk := await file.read(64 * 1024):
            total_bytes += len(chunk)
            if total_bytes > max_size:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="File size exceeds maximum limit of 10MB",
                )
            chunks.append(chunk)
            if not header_checked:
                header_bytes = b"".join(chunks)
                if len(header_bytes) >= 4:
                    if not header_bytes.startswith(b"%PDF"):
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid PDF file format",
                        )
                    header_checked = True

        file_bytes = b"".join(chunks)
        if not file_bytes.startswith(b"%PDF"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid PDF file format",
            )

        items = svc.parse_pdf(file_bytes, customer_id)
        return ParseResponse(items=items)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse PDF order: {str(e)}",
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
