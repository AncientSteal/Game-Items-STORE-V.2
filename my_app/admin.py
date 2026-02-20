from django.contrib import admin
from .models import Category, Item, CartItem, Cart, Order, OrderItem


# Register your models here.

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug'] # свойства, которые будут отображаться
    prepopulated_fields = {'slug': ('name',)} # автоматическое создание слага на основе имени категории

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'stock', 'available'] # свойства, которые будут отображаться
    list_filter = ['available', 'category'] # фильтр по категориям и доступности
    list_editable = ['price', 'stock', 'available']  # можно менять цену прямо в списке
    search_fields = ['name', 'description'] # можем искать товар по имени и описанию
    prepopulated_fields = {'slug': ('name',)}  # автоматическое создание слага на основе имени

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'session_key', 'created_at']
    list_filter = ['user', 'session_key', 'created_at']

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart', 'item', 'quantity']
    list_filter = ['cart', 'item', 'quantity']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['user', 'first_name', 'created', 'paid']
    list_filter = ['first_name','created', 'paid']

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'item', 'quantity', 'price']
    list_filter = ['order', 'item', 'quantity', 'price']