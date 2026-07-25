class BaseAppException(Exception):
    def __init__(self, message: str, status_code: int = 400, error_id: str = "ERR-GENERIC"):
        self.message = message
        self.status_code = status_code
        self.error_id = error_id
        super().__init__(self.message)
