from django.contrib import admin
from .models import Event, Fight


class FightInline(admin.TabularInline):
    model = Fight
    extra = 0

    def get_readonly_fields(self, request, obj=None):
        return [field.name for field in self.model._meta.fields]


class EventAdmin(admin.ModelAdmin):
    list_display = ('name', 'date', 'location', 'scraped_at')
    inlines = [FightInline]


class FightAdmin(admin.ModelAdmin):
    list_display = ('event', 'card', 'order', 'blue_name', 'red_name', 'winner', 'method', 'round')


admin.site.register(Event, EventAdmin)
admin.site.register(Fight, FightAdmin)
