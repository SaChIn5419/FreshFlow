import uuid
from typing import List, Optional
from pydantic import BaseModel

class ParsedItem(BaseModel):
    raw_name: str
    quantity: float
    unit: str
    matched_product_id: Optional[uuid.UUID] = None
    matched_product_name: Optional[str] = None
    confidence: float
    # We can pass the top 3 matches for the UI if confidence is low
    top_matches: List[dict] = [] # list of { product_id, name, unit }

class ParseResponse(BaseModel):
    items: List[ParsedItem]
    
class ParseTextRequest(BaseModel):
    customer_id: uuid.UUID
    text: str
