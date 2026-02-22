from django.core.paginator import Paginator, EmptyPage
from django.shortcuts import render, get_object_or_404, redirect
from django.db.models import Sum, Q
from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.views import LoginView
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm
from django.http import JsonResponse
from django.template.loader import render_to_string

from .forms import OrderCreateForm
from .models import Item, Category, Cart, CartItem, OrderItem, Order

from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def item_list(request, category_slug=None):
    items = Item.objects.filter(available=True)
    category = None
    categories = Category.objects.all()
    cart = get_cart(request)
    cart_data = {ci.item_id: ci.quantity for ci in cart.items.all()}

    query = request.GET.get('q', '')
    if query:
        items = items.filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        )

    if category_slug:
        category = get_object_or_404(Category, slug=category_slug)
        items = Item.objects.filter(category=category)

    for item in items:
        item.in_cart_qty = cart_data.get(item.id, 0)
        item.is_limit = item.in_cart_qty >= item.stock

    paginator = Paginator(items, 12)
    page_number = request.GET.get('page', 1)

    try:
        page_obj = paginator.page(page_number)
    except EmptyPage:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'html': '', 'has_next': False})
        page_obj = paginator.page(1)

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        html = render_to_string('my_app/item/includes/item_list_partial.html', {'items': page_obj}, request=request)
        return JsonResponse({
            'html': html,
            'has_next': page_obj.has_next()
        })
    return render(request, 'my_app/item/list.html', {
        'items':  page_obj,
        'category': category,
        'categories': categories,
    })

def item_detail(request, category_slug, slug):
    item = get_object_or_404(Item, slug=slug)
    categories = Category.objects.all()
    cart = get_cart(request)
    cart_data = {ci.item_id: ci.quantity for ci in cart.items.all()}
    item.in_cart_qty = cart_data.get(item.id, 0)
    item.is_limit = item.in_cart_qty >= item.stock
    return render(request, 'my_app/item/detail.html', {
        'item': item,
        'categories': categories,
    })

def get_cart(request):
    if request.user.is_authenticated:
        cart, created = Cart.objects.get_or_create(user=request.user)
    else:
        if not request.session.session_key:
            request.session.create()
        cart, created = Cart.objects.get_or_create(session_key=request.session.session_key)
    return cart

def add_to_cart(request, item_id):
    cart = get_cart(request)
    item = get_object_or_404(Item, id=item_id)
    cart_item, created = CartItem.objects.get_or_create(cart=cart, item=item)

    if not created:
        if cart_item.quantity < item.stock:
            cart_item.quantity += 1
            cart_item.save()
            messages.success(request, f"Количество «{item.name}» увеличено.")
        else:
            messages.warning(request, f"Достигнут лимит товара на складе.")
    else:
        messages.success(request, f"«{item.name}» добавлен в корзину.")

    return redirect(request.META.get('HTTP_REFERER', 'item_list'))

def add_to_cart_ajax(request, item_id):
    cart = get_cart(request)
    item = get_object_or_404(Item, id=item_id)

    if item.stock <= 0:
        return JsonResponse({
            'status': 'error',
            'message': 'Товара нет в наличии'
        }, status=400)

    cart_item, created = CartItem.objects.get_or_create(cart=cart, item=item)
    status='success'

    if not created:
        if cart_item.quantity < item.stock:
            cart_item.quantity += 1
            cart_item.save()
            message = f"Ещё один «{item.name}» добавлен в инвентарь!"
        else:
            status = 'warning'
            message = f"Извините, {item.name} закончился на складе."

    else:
        message = f"Товар «{item.name}» добавлен в инвентарь!"

    total_quantity = cart.items.aggregate(total=Sum('quantity'))['total'] or 0
    return JsonResponse({
        'status': status,
        'message': message,
        'quantity': cart_item.quantity,
        'item_total': float(cart_item.get_total_price()),
        'total_price': float(sum(i.get_total_price() for i in cart.items.all())),
        'cart_count': total_quantity,
        'is_limit': cart_item.quantity >= item.stock,
        'total_stock': item.stock,
    })

def cart_detail(request):
    cart = get_cart(request)
    cart_items = cart.items.select_related('item')
    total_price = sum(item.get_total_price() for item in cart_items)

    return render(request, 'my_app/cart/detail.html', {
        'cart': cart,
        'total_price': total_price,
        'cart_items': cart_items,
    })

def cart_remove(request, item_id):
    cart = get_cart(request)
    item = get_object_or_404(Item, id=item_id)
    cart_item = get_object_or_404(CartItem, cart=cart, item=item)

    if cart_item.quantity > 1:
        cart_item.quantity -= 1
        cart_item.save()
    else:
        cart_item.delete()

    return redirect(request.META.get('HTTP_REFERER', 'cart_detail'))

def cart_remove_ajax(request, item_id):
    cart = get_cart(request)
    item = get_object_or_404(Item, id=item_id)

    try:
        cart_item = CartItem.objects.get(cart=cart, item=item)
        if cart_item.quantity > 1:
            cart_item.quantity -= 1
            cart_item.save()
            action='updated'
            quantity = cart_item.quantity
            item_total = float(cart_item.get_total_price())
        else:
            cart_item.delete()
            action='removed'
            quantity = 0
            item_total = 0
    except CartItem.DoesNotExist:
        return JsonResponse({'status': 'error', 'message':'Товар не найден'}, status=404)

    total_quantity = cart.items.aggregate(total=Sum('quantity'))['total'] or 0
    total_price = sum(item.get_total_price() for item in cart.items.all())
    return JsonResponse({
        'status': 'success',
        'action': action,
        'total_price': float(total_price),
        'cart_count': total_quantity,
        'quantity': quantity,
        'item_total': item_total,
        'is_limit': cart_item.quantity >= item.stock,
        'total_stock': item.stock,
    })

def order_create(request):
    cart = get_cart(request)
    cart_total_price = sum(item.get_total_price() for item in cart.items.all())

    if not cart.items.exists():
        return redirect('cart_detail')

    if request.method == 'POST':
        form = OrderCreateForm(request.POST)
        if form.is_valid():
            for cart_item in cart.items.all():
                if cart_item.quantity > cart_item.item.stock:
                    messages.error(request,f"Ошибка: товара '{cart_item.item.name}' недостаточно на складе. В наличии: {cart_item.item.stock} шт.")
                    return render(request, 'my_app/order/create.html', {
                        'cart': cart,
                        'form': form,
                        'cart_total_price': cart_total_price
                    })
            order = form.save(commit=False)
            if request.user.is_authenticated:
                order.user = request.user
            order.save()

            for cart_item in cart.items.all():
                OrderItem.objects.create(
                    order=order,
                    item=cart_item.item,
                    price=cart_item.item.price,
                    quantity=cart_item.quantity
                )
                product = cart_item.item
                product.stock -= cart_item.quantity
                if product.stock <= 0:
                    product.available = False
                product.save()

            cart.items.all().delete()
            request.session['last_order_id'] = order.id

            return redirect('order_created')
    else:
        form = OrderCreateForm()
    return render(request, 'my_app/order/create.html', {'cart':cart, 'form':form})

def order_created(request):
    order_id = request.session.get('last_order_id')
    if not order_id:
        return redirect('item_list')
    order = get_object_or_404(Order, id=order_id)
    return render(request, 'my_app/order/created.html', {'order':order})

@login_required
def user_profile(request):
    orders = Order.objects.filter(user=request.user).prefetch_related('items__item')
    return render(request, 'my_app/account/profile.html', {
        'orders': orders,
    })

def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, f" Добро пожаловать, {user.username}! Аккаунт создан.")
            return redirect('item_list')
    else:
            form = UserCreationForm()
    return render(request, 'my_app/account/register.html', {'form': form})

class MyLoginView(LoginView):
    template_name = 'my_app/account/login.html'

def item_search_ajax(request):
    query = request.GET.get('q', '')
    if query:
        items = Item.objects.filter(Q(name__icontains=query) | Q(description__icontains=query), available=True)
    else:
        items = Item.objects.filter(available=True)
    html = render_to_string('my_app/item/includes/item_list_partial.html', {'items': items}, request=request)
    return JsonResponse({'html': html})