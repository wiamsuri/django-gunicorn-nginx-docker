from . import views
from  django.urls import path


urlpatterns = [

    path('', views.index, name='home'),
<<<<<<< HEAD
    #path('', views.jobViews, name='jobs'),
    path('portfolilio-page.html', views.jobViews, name='sec'),
=======
    path('', views.jobViews, name='jobs'),
>>>>>>> 5adaffae9be96c57bd9b313ffc568b5b0f9be402
    path('index.html', views.PostList.as_view() ,  name = 'index') ,

]
