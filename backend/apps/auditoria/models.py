from django.db import models
from django.conf import settings
from apps.empresas.models import Empresa

class Auditoria(models.Model):
   usuario =  models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuario_auditoria'
    )
   empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, null=True, blank=True, related_name='empresa_auditoria')
   acao = models.CharField(max_length=255)
   detalhes = models.TextField(blank=True, null=True)
   ip_origem = models.GenericIPAddressField(blank=True, null=True)
   criado_em = models.DateTimeField(auto_now_add=True)



