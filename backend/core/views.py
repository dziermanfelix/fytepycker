from django.views.generic import View
from django.http import HttpResponse, FileResponse, Http404
from pathlib import Path
import mimetypes
import os

FRONTEND_STATIC = Path(__file__).resolve().parent.parent.parent / 'frontend' / 'static'


def _frontend_file(relative_path, content_type=None):
    base = FRONTEND_STATIC.resolve()
    path = (FRONTEND_STATIC / relative_path).resolve()
    if not str(path).startswith(str(base)) or not path.is_file():
        raise Http404()
    guessed, _ = mimetypes.guess_type(str(path))
    return FileResponse(path.open('rb'), content_type=content_type or guessed or 'application/octet-stream')


class FrontendAppView(View):
    def get(self, request):
        try:
            with open(os.path.join(os.path.dirname(__file__), '../../frontend/static/index.html')) as f:
                return HttpResponse(f.read())
        except FileNotFoundError:
            return HttpResponse("index.html not found", status=501)


class ManifestView(View):
    def get(self, request):
        return _frontend_file('manifest.webmanifest', 'application/manifest+json')


class AppleTouchIconView(View):
    def get(self, request):
        # Prefer root copy; fall back to icons/
        for relative in ('apple-touch-icon.png', 'icons/apple-touch-icon.png'):
            try:
                return _frontend_file(relative, 'image/png')
            except Http404:
                continue
        raise Http404()


class PwaIconView(View):
    def get(self, request, path):
        return _frontend_file(Path('icons') / path)
