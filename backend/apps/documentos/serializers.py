from rest_framework import serializers
from .models import Documento
from apps.empresas.serializers import EmpresaResumoSerializer
from apps.usuarios.serializers import UsuarioResumoSerializer   

class DocumentoSerializer(serializers.ModelSerializer):
    empresa = EmpresaResumoSerializer(read_only=True)
    enviado_por = UsuarioResumoSerializer(read_only=True)
    class Meta:
        model = Documento
        fields = ['id', 'empresa', 'chave_acesso', 'tipo', 'numero_nota', 'serie', 'data_emissao', 'valor_total', 
                  'status', 'enviado_por', 'criado_em']