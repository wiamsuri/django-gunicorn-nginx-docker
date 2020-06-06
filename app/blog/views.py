from django.shortcuts import render
from django.views import generic
from .models import Post


class PostList(generic.ListView):
    queryset = Post.objects.filter(status=1).order_by('-created_on')
    template_name = 'index.html'

def index(request):
    context = {}
    return render(request, 'base.html', context)

def jobViews(request):
    context = {}
    return render(request, 'portfolio-page.html', context)
