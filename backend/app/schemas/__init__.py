from app.schemas.user import UserCreate, UserLogin, UserUpdate, UserResponse, TokenResponse
from app.schemas.ai import ChatRequest, ChatResponse, ModelInfo, AskDocumentRequest
from app.schemas.conversation import ConversationCreate, ConversationResponse, MessageResponse, ConversationUpdate
from app.schemas.material import SubjectCreate, SubjectResponse, MaterialResponse, DocumentChunkResponse, NoteCreate, NoteUpdate, NoteResponse
from app.schemas.quiz import QuizGenerateRequest, QuizPublicResponse, QuizSubmitRequest, QuizAttemptResponse, QuizQuestionPublic
from app.schemas.review import ReviewCardCreate, ReviewCardResponse, ReviewAnswerRequest, ReviewAnswerResponse
from app.schemas.study_plan import GoalCreate, GoalResponse, TaskCreate, TaskResponse, AISuggestPlanRequest
from app.schemas.memory import MemoryCreate, MemoryUpdate, MemoryResponse
from app.schemas.analytics import AnalyticsOverviewResponse, DailyStudyTime, SubjectAccuracy, WeakTopic

__all__ = [
    "UserCreate",
    "UserLogin",
    "UserUpdate",
    "UserResponse",
    "TokenResponse",
    "ChatRequest",
    "ChatResponse",
    "ModelInfo",
    "AskDocumentRequest",
    "ConversationCreate",
    "ConversationResponse",
    "MessageResponse",
    "ConversationUpdate",
    "SubjectCreate",
    "SubjectResponse",
    "MaterialResponse",
    "DocumentChunkResponse",
    "NoteCreate",
    "NoteUpdate",
    "NoteResponse",
    "QuizGenerateRequest",
    "QuizPublicResponse",
    "QuizSubmitRequest",
    "QuizAttemptResponse",
    "QuizQuestionPublic",
    "ReviewCardCreate",
    "ReviewCardResponse",
    "ReviewAnswerRequest",
    "ReviewAnswerResponse",
    "GoalCreate",
    "GoalResponse",
    "TaskCreate",
    "TaskResponse",
    "AISuggestPlanRequest",
    "MemoryCreate",
    "MemoryUpdate",
    "MemoryResponse",
    "AnalyticsOverviewResponse",
    "DailyStudyTime",
    "SubjectAccuracy",
    "WeakTopic",
]
