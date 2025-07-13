from sqlalchemy import create_engine, Column, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env

DATABASE_URL = (
    f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}"
    f"@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}"
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
    status = Column(String, default="uploaded", nullable=False) # e.g., "uploaded", "pending", "processed", "failed"
    summary = Column(Text, nullable=True)
    # Add other fields like extracted_definitions, generated_questions as JSONB or separate tables
    # for now, let's keep it simple for MVP.

# Example for other tables (future)
# class Definition(Base):
#     __tablename__ = "definitions"
#     id = Column(String, primary_key=True, index=True)
#     paper_id = Column(String, ForeignKey("papers.id"))
#     term = Column(String, nullable=False)
#     definition = Column(Text, nullable=False)
#     # Add relationship back to Paper
#     paper = relationship("Paper", back_populates="definitions")

# Base.metadata.create_all(bind=engine) # This will create tables on startup if they don't exist