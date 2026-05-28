from django.db import models
from apps.empresas.models import Empresa
from django.conf import settings


class TipoChoices(models.TextChoices):
    NFE = 'NFe', 'Nota Fiscal Eletrônica'
    NFCE = 'NFCe', 'Nota Fiscal de Consumidor Eletrônica'
    CTE = 'CTe', 'Conhecimento de Transporte Eletrônico'
    MDFE = 'MDFe', 'Manifesto de Documentos Fiscais Eletrônico'


class StatusChoices(models.TextChoices):
    AUTORIZADO = 'autorizado', 'Autorizado'
    CANCELADO = 'cancelado', 'Cancelado'


class Documento(models.Model):
    empresa = models.ForeignKey(
        Empresa, on_delete=models.PROTECT, null=False, blank=False, related_name='documentos')
    chave_acesso = models.CharField(max_length=44, unique=True)
    tipo = models.CharField(
        max_length=4,
        choices=TipoChoices.choices,
        blank=False,
        null=False
    )
    numero_nota = models.CharField(max_length=20)
    serie = models.CharField(max_length=10)
    data_emissao = models.DateField()
    valor_total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        blank=False,
        null=False
    )
    caminho_arquivo = models.CharField(max_length=255)
    enviado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documentos_enviados'
    )
    criado_em = models.DateTimeField(auto_now_add=True)
