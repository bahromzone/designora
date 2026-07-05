from sqladmin import ModelView

from app.models.payment import Payment


class PaymentAdmin(ModelView, model=Payment):
    name = "Payments"
    icon = "fa-solid fa-credit-card"
    column_list = [Payment.id, Payment.amount, Payment.status]
