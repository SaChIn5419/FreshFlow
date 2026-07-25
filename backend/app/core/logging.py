import logging
import sys
from pathlib import Path

# Ensure logs directory exists
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)

def setup_logging():
    log_format = (
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(LOGS_DIR / "application.log"),
        ],
    )
    
    # Specific error logger
    error_handler = logging.FileHandler(LOGS_DIR / "errors.log")
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(logging.Formatter(log_format))
    logging.getLogger().addHandler(error_handler)
    
    # Access logger will be used by middleware
    access_logger = logging.getLogger("access")
    access_logger.setLevel(logging.INFO)
    access_handler = logging.FileHandler(LOGS_DIR / "access.log")
    access_handler.setFormatter(logging.Formatter("%(asctime)s - %(message)s"))
    access_logger.addHandler(access_handler)
    
    # Stop propagation of access logs to root logger so they don't double log
    access_logger.propagate = False

setup_logging()
