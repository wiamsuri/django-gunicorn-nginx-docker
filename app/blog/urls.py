from . import views
from  django.urls import path


urlpatterns = [

    path('', views.index, name='home'),
    #path('', views.jobViews, name='jobs'),
    path('portfolilio-page.html', views.jobViews, name='sec'),
    path('index.html', views.PostList.as_view() ,  name = 'index') ,

]
