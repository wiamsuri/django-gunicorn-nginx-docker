from . import views
from  django.urls import path


urlpatterns = [

    path('', views.index, name='home'),
    path('', views.jobViews, name='jobs'),
    path('index.html', views.PostList.as_view() ,  name = 'index') ,

]
