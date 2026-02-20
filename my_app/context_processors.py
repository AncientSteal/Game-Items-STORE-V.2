from .views import get_cart
from django.db.models import Sum

# полезный файл, чтобы не прописывать в функциях корзины и главной страницы каталога дубликат кода, мы используем
# контекстные процессоры, которые выполняются при каждом запросе, поэтому код внутри них должен быть максимально быстрым

def cart_info(request):
    cart = get_cart(request)
    total_quantity = cart.items.aggregate(total=Sum('quantity'))['total'] or 0 # делаем запрос к базе и достаём из словаря число
    return {'total_quantity': total_quantity}