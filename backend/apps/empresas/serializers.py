from rest_framework import serializers
from apps.empresas.models import Empresa
from apps.usuarios.serializers import UsuarioResumoSerializer

class EmpresaSerializer(serializers.ModelSerializer):
    cadastrado_por = UsuarioResumoSerializer(read_only=True)
    atualizado_por = UsuarioResumoSerializer(read_only=True)
    class Meta:
        model = Empresa
        fields = ['id', 'cnpj', 'razao_social', 'nome_fantasia', 'inscricao_estadual', 'codigo_interno',
        'desativado', 'desativado_em', 'criado_em', 'atualizado_em', 'cadastrado_por', 'atualizado_por']


class EmpresaResumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = ['id', 'codigo_interno','cnpj', 'nome_fantasia']

class EmpresaCredenciaisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = ['id', 'client_id', 'client_secret']