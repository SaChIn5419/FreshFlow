from .base import BaseAppException

class OrderNotFound(BaseAppException):
    def __init__(self, message: str = "Order not found"):
        super().__init__(message=message, status_code=404, error_id="ERR-ORD-001")

class OrderEmpty(BaseAppException):
    def __init__(self, message: str = "Order has no items"):
        super().__init__(message=message, status_code=400, error_id="ERR-ORD-002")
