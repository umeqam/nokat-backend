from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NOKAT")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/posts")
def get_posts():
    return [
        {"id": 1, "who": "Ахмет", "what": "Ищу поставщика перца", "where": "Ашгабат", "trust": 85, "type": "ищу"},
        {"id": 2, "who": "Мурад", "what": "Предлагаю ремонт сантехники", "where": "Копетдаг", "trust": 92, "type": "предлагаю"}
    ]

@app.post("/posts")
def create_post(data: dict):
    return {"id": 999, "status": "ok", **data}

print("NOKAT API running...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
