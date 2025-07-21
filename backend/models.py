from pydantic import BaseModel, Field


class Question(BaseModel):
    question: str = Field(description="The text of the question.")
    type: str = Field(
        description="The type of question (e.g., 'multiple_choice', 'short_answer')."
    )
    options: list[str] = Field(
        default_factory=list,
        description="List of options for multiple choice questions. Empty if short_answer.",
    )
    correct_answer: str = Field(description="The correct answer to the question.")


class Questions(BaseModel):
    questions: list[Question] = Field(description="A list of generated questions.")


class Definition(BaseModel):
    term: str = Field(description="The key term or concept extracted.")
    definition: str = Field(description="The concise definition of the term.")


class Definitions(BaseModel):
    definitions: list[Definition] = Field(
        description="A list of extracted terms and their definitions."
    )
