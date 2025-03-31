from django.contrib import admin
from .models import Matchup, Selection, SelectionResult


class SelectionInline(admin.TabularInline):
    model = Selection
    extra = 0

    def get_readonly_fields(self, request, obj=None):
        return [field.name for field in self.model._meta.fields]


class MatchupAdmin(admin.ModelAdmin):
    list_display = ('id', 'event', 'user_a', 'user_b', 'created_at')
    inlines = [SelectionInline]


class SelectionAdmin(admin.ModelAdmin):
    list_display = ('id', 'matchup', 'fight', 'user', 'fighter', 'created_at', 'updated_at')


class SelectionResultAdmin(admin.ModelAdmin):
    list_display = ('id', 'matchup', 'fight', 'winner', 'winnings')


admin.site.register(Matchup, MatchupAdmin)
admin.site.register(Selection, SelectionAdmin)
admin.site.register(SelectionResult, SelectionResultAdmin)
