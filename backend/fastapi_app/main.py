from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_app.config import ALLOWED_ORIGINS
from fastapi_app.database import engine, Base
from fastapi_app.controllers import auth_controller, user_controller, admin_controller, file_controller
from fastapi_app.seed import seed_users

Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed the database when the app starts.
    seed_users()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers from controllers.
app.include_router(auth_controller.router, prefix="/auth")
app.include_router(user_controller.router, prefix="/users")
app.include_router(admin_controller.router, prefix="/admin")
app.include_router(file_controller.router, prefix="/files")

if __name__ == "__main__":
    import sys
    print(sys.path)
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
