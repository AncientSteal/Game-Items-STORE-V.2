from django.conf.urls.static import static
from django.conf import settings
from django.contrib import admin
from django.urls import path
from django.contrib.auth import views as auth_views

from . import views

urlpatterns = [
    path('', views.item_list, name='item_list'),
    path('cart_add/<int:item_id>/', views.add_to_cart, name='cart_add'),
    path('cart/add-ajax/<int:item_id>/', views.add_to_cart_ajax, name='add_to_cart_ajax'),
    path('cart_remove/<int:item_id>/', views.cart_remove, name='cart_remove'),
    path('cart/remove-ajax/<int:item_id>/', views.cart_remove_ajax, name='cart_remove_ajax'),
    path('cart/detail/', views.cart_detail, name='cart_detail'),
    path('order/create/', views.order_create, name='order_create'),
    path('order/success/', views.order_created, name='order_created'),
    path('account/profile/', views.user_profile, name='user_profile'),
    path('account/register/', views.register, name='register'),
    path('account/login/', views.MyLoginView.as_view(), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('item-search-ajax/', views.item_search_ajax, name='item_search_ajax'),
    path('<slug:category_slug>/', views.item_list, name='item_list_by_category'),
    path('<slug:category_slug>/<slug:slug>/', views.item_detail, name='item_detail'),
]