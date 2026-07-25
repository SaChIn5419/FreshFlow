from .base import BaseAppException

class InvoiceNotFound(BaseAppException):
    def __init__(self, message: str = "Invoice not found"):
        super().__init__(message=message, status_code=404, error_id="ERR-INV-001")

class InvoiceAlreadyGenerated(BaseAppException):
    def __init__(self, message: str = "Invoice already generated for this order"):
        super().__init__(message=message, status_code=409, error_id="ERR-INV-002")

class InvoiceNumberExists(BaseAppException):
    def __init__(self, message: str = "Invoice number already exists"):
        super().__init__(message=message, status_code=409, error_id="ERR-INV-003")

class CompanySettingsMissing(BaseAppException):
    def __init__(self, message: str = "Company configuration missing."):
        super().__init__(message=message, status_code=500, error_id="ERR-SYS-001")
