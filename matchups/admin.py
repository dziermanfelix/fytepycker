from django.contrib import admin
from .models import Matchup, Selection, SelectionResult


class SelectionInline(admin.TabularInline):
    model = Selection
    extra = 0

    def get_readonly_fields(self, request, obj=None):
        return [field.name for field in self.model._meta.fields]


class MatchupAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        model_fields = [field.name for field in Selection._meta.get_fields() if field.concrete]
        return model_fields
    inlines = [SelectionInline]


class SelectionAdmin(admin.ModelAdmin):
    def get_list_display(self, request):
        model_fields = [field.name for field in Selection._meta.get_fields() if field.concrete]
        return model_fields


class SelectionResultAdmin(admin.ModelAdmin):
    list_display = ('id', 'matchup', 'fight', 'winner', 'winnings')


admin.site.register(Matchup, MatchupAdmin)
admin.site.register(Selection, SelectionAdmin)
admin.site.register(SelectionResult, SelectionResultAdmin)
