from rest_framework import serializers
from .models import Auditoria
from apps.empresas.serializers import EmpresaResumoSerializer
from apps.usuarios.serializers import UsuarioResumoSerializer


class AuditoriaSerializer(serializers.ModelSerializer):
    usuario = UsuarioResumoSerializer(read_only=True)
    empresa = EmpresaResumoSerializer(read_only=True)

    class Meta:
        model = Auditoria
        fields = ['id', 'usuario', 'empresa', 'acao', 'detalhes', 'ip_origem', 'criado_em']