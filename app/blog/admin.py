from django.contrib import admin
from .models import Post


class PostAdmin(admin.ModelAdmin):
    list_display = ('title' , 'slug' , 'status' , 'created_on')
    list_filter = ('status' , )
    search_fields = ['title' , 'content']
    prepopulated_fields = {'slug' : ('title' ,)}

admin.site.register(Post , PostAdmin)





#The list_display attribute does what its name suggests display the properties mentioned in the tuple in the post list for each post.

#If you notice at the right, there is a filter which is filtering the post depending on their Status this is done by the list_filter method.

#And now we have a search bar at the top of the list, which will search the database from the search_fields attributes. The last attribute prepopulated_fields populates the slug, now if you create a post the slug will automatically be filled based upon your title.
