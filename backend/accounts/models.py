from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    username = models.CharField(
        _('username'),
        max_length=24,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^[\w.-]+$',
                message='Username may contain only letters, numbers, and ./-/_ characters.'
            ),
        ],
    )
    email = models.EmailField(_('email address'), unique=True)

    class Meta:
        ordering = ['username']
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['email']),
        ]

    def save(self, *args, **kwargs):
        self.username = self.username.lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username
