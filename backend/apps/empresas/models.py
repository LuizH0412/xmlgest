from django.db import models
from django.conf import settings
import secrets



class Empresa(models.Model):
    cnpj = models.CharField(max_length=20, unique=True, blank=False, null=False)
    razao_social = models.CharField(max_length=255, blank=False, null=False)
    nome_fantasia = models.CharField(max_length=255, blank=False, null=False)
    inscricao_estadual = models.CharField(max_length=50, blank=True, null=True)
    codigo_interno = models.CharField(max_length=10, blank=False, null=False, unique=True)
    client_id = models.CharField(max_length=255, blank=True, null=False, default='')
    client_secret = models.CharField(max_length=255, blank=True, null=False, default='')
    desativado = models.BooleanField(default=False)
    desativado_em = models.DateTimeField(blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    cadastrado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='empresas_cadastradas')
    atualizado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='empresas_atualizadas')
    email_contabilidade = models.EmailField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.client_id:
            self.client_id = secrets.token_urlsafe(32)
        if not self.client_secret:
            self.client_secret = secrets.token_urlsafe(64)
        super().save(*args, **kwargs)
