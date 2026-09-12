"""Start Waitress with the network settings loaded from .env.local."""
import logging
from waitress import serve
from app import app, SERVER_HOST, SERVER_PORT

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s: %(message)s')
    serve(app, host=SERVER_HOST, port=SERVER_PORT)
