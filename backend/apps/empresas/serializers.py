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

class EmpresaCertificadoSerializer(serializers.ModelSerializer):
    senha = serializers.CharField(write_only=True)

    class Meta:
        model = Empresa
        fields = ['certificado_pfx', 'senha', 'certificado_validade']
        read_only_fields = ['certificado_validade']

    def validate(self, attrs):
        pfx = attrs.get('certificado_pfx')
        senha = attrs.get('senha')

        if pfx and senha:
            try:
                pfx_bytes = pfx.read()
                pfx.seek(0)
                pkcs12.load_key_and_certificates(pfx_bytes, senha.encode())
            except Exception:
                raise serializers.ValidationError('Certificado ou senha inválidos.')

        return attrs

    def update(self, instance, validated_data):
        senha = validated_data.pop('senha', None)
        pfx = validated_data.get('certificado_pfx')

        if pfx and senha:
            # Extrai validade do certificado
            pfx_bytes = pfx.read()
            pfx.seek(0)
            _, cert, _ = pkcs12.load_key_and_certificates(pfx_bytes, senha.encode())
            instance.certificado_validade = cert.not_valid_after_utc.date()
            instance.certificado_senha = criptografar_senha(senha)

        instance.certificado_pfx = validated_data.get('certificado_pfx', instance.certificado_pfx)
        instance.save()
        return instance