# пусковой скрипт, который соберёт статику, сделает миграции и запустит сервер
python manage.py collectstatic --noinput

python manage.py migrate

python manage.py runserver 0.0.0.0:80