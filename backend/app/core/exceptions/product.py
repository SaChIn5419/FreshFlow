from .base import BaseAppException

class ProductNotFound(BaseAppException):
    def __init__(self, message: str = "Product not found"):
        super().__init__(message=message, status_code=404, error_id="ERR-PROD-001")

class ProductInactive(BaseAppException):
    def __init__(self, message: str = "Product is inactive"):
        super().__init__(message=message, status_code=400, error_id="ERR-PROD-002")
