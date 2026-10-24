import os
import sys

# Ensure backend root is in sys.path for serverless execution
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

# Export for Vercel and WSGI/ASGI runners
handler = app
__all__ = ["app", "handler"]
