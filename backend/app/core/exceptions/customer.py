from .base import BaseAppException

class CustomerNotFound(BaseAppException):
    def __init__(self, message: str = "Customer not found"):
        super().__init__(message=message, status_code=404, error_id="ERR-CUST-001")

class CustomerInactive(BaseAppException):
    def __init__(self, message: str = "Customer is inactive"):
        super().__init__(message=message, status_code=400, error_id="ERR-CUST-002")

class DuplicateCustomer(BaseAppException):
    def __init__(self, message: str = "Customer already exists"):
        super().__init__(message=message, status_code=409, error_id="ERR-CUST-003")
