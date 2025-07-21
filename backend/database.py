# backend/database.py
import os
import uuid
from datetime import datetime

from dotenv import load_dotenv
from sqlalchemy import Column, DateTime, String, Text, create_engine
from sqlalchemy.dialects.postgresql import JSONB  # Import JSONB for structured data
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()  # Load environment variables from .env

DATABASE_URL = (
    f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}"
    f"@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}"
    f"/{os.getenv('POSTGRES_DB')}"
)

# If running FastAPI in Docker, DB_HOST should be the service name 'db'
# If running FastAPI locally, DB_HOST should be 'localhost'
if os.getenv("RUNNING_IN_DOCKER") == "true":
    DATABASE_URL = (
        f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}"
        f"@db:{os.getenv('DB_PORT', '5432')}"  # 'db' is the service name in docker-compose
        f"/{os.getenv('POSTGRES_DB')}"
    )


engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Paper(Base):
    __tablename__ = "papers"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, index=True, nullable=False)
    upload_date = Column(DateTime, default=datetime.now, nullable=False)
    status = Column(
        String, default="uploaded", nullable=False
    )  # e.g., "uploaded", "pending", "processed", "failed"
    summary = Column(Text, nullable=True)  # Text for summary
    extracted_definitions = Column(
        JSONB, nullable=True
    )  # JSONB for definitions (list of objects)
    generated_questions = Column(
        JSONB, nullable=True
    )  # JSONB for questions (list of objects)

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "upload_date": self.upload_date.isoformat(),
            "status": self.status,
            "summary": self.summary,
            "extracted_definitions": self.extracted_definitions,
            "generated_questions": self.generated_questions,
        }


Base.metadata.create_all(bind=engine)  # This creates tables if they don't exist.
# For existing databases, you might use Alembic for migrations instead.
# For a simple development setup, uncommenting this line will create/update tables
# on FastAPI startup if `uvicorn --reload` is used and database is empty.
