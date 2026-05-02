from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db

app = FastAPI(title='NOKAT API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.on_event('startup')
def startup():
    init_db()

@app.options('/{full_path:path}')
async def preflight_handler(full_path: str):
    return {}

@app.get('/health')
def health():
    return {'status': 'ok'}

@app.get('/posts')
def get_posts(mode: str = None, region: str = None, limit: int = 20):
    return []

@app.post('/users')
def create_user(username: str):
    return {'id': 1, 'username': username}
