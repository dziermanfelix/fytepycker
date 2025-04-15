from django.contrib import admin
from .models import Event, Fight


class FightInline(admin.TabularInline):
    model = Fight
    extra = 0

    def get_readonly_fields(self, request, obj=None):
        return [field.name for field in self.model._meta.fields]


class EventAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'headline', 'date', 'location', 'scraped_at')
    inlines = [FightInline]


class FightAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        model_fields = [field.name for field in Fight._meta.get_fields() if field.concrete]
        return model_fields


admin.site.register(Event, EventAdmin)
admin.site.register(Fight, FightAdmin)
