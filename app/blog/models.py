from django.db import models
from django.contrib.auth.models  import User

STATUS = (
    (0 , "Draft"),
    (1 , "Publish")
)

class Post(models.Model):
    title = models.CharField(max_length=200 , unique=True)
    slug = models.SlugField(max_length=200 , unique=True)
    author = models.ForeignKey(User , on_delete=models.CASCADE , related_name='blog_posts')
    updated_on = models.DateTimeField(auto_now=True)
    content = models.TextField()
    created_on = models.DateTimeField(auto_now_add=True)
    status = models.IntegerField(choices=STATUS , default=0)



    class Mate:
        ordering = ['-created_on']

        def __str__(self):
            return self.title
#At the top, we’re importing
#the class models and then creating
# a subclass of models.Model Like any typical blog
#each blog post will have a title, slug, author name, and
# the timestamp or date when the article was published or last updated.
#Notice how we declared a tuple for STATUS of a post to keep draft and
#published posts separated when we render them out with templates.

#The Meta class inside the model contains metadata.
# We tell Django to sort results in the created_on field in descending order
# by default when we query the database.
#We specify descending order using the negative prefix.
#By doing so, posts published recently will appear first.
#The __str__() method is the default human-readable representation of the object.
#Django will use it in many places, such as the administration site.
