from fastapi import Request
from sqladmin import ModelView


class SecureModelView(ModelView):
    async def is_accessible(self, request: Request) -> bool:
        user = request.session.get("user")
        return bool(user and user.get("role") == "admin")
