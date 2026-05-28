from typing import List, Optional

from pydantic import BaseModel, Field


class ApplicationChecklist(BaseModel):
    """
    Structured checklist extracted from scholarship or university application text.
    """

    deadline: Optional[str] = Field(
        default=None,
        description="Application or scholarship deadline if explicitly mentioned.",
    )

    required_documents: List[str] = Field(
        default_factory=list,
        description="Documents the student needs to prepare.",
    )

    eligibility_notes: List[str] = Field(
        default_factory=list,
        description="Eligibility rules, conditions, or applicant requirements.",
    )

    missing_information: List[str] = Field(
        default_factory=list,
        description="Important information missing from the user's text.",
    )

    next_steps: List[str] = Field(
        default_factory=list,
        description="Practical next actions the student should take.",
    )