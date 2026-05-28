from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('O email é obrigatório')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('perfil', 'admin')
        return self.create_user(email, password, **extra_fields)

class PerfilChoices(models.TextChoices):
    ADMIN = 'admin', 'Admin'
    SUPERVISAO = 'supervisao', 'Supervisão'
    PEV = 'pev', 'PEV'

class Usuario(AbstractUser):
    objects = UsuarioManager()
    username = None
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    email = models.EmailField(unique=True, blank=False, null=False)
    nome = models.CharField(max_length=255, blank=True, null=True)
    perfil = models.CharField(
        max_length=20,
        choices=PerfilChoices.choices,
        blank=False,
        null=False
    )
    desativado = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)
    desativado_em = models.DateTimeField(null=True, blank=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    cadastrado_por = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
