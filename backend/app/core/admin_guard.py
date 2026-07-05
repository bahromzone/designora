from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User


def admin_required(
    request: Request,
    db: Session = Depends(get_db),
    email: str = Depends(get_current_user),
) -> User:
    user = db.query(User).filter(User.email == email).first()

    if not user or user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin huquqi yo‘q"
        )

    return user
