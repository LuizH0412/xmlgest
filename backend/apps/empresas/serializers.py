from rest_framework import serializers
from apps.empresas.models import Empresa
from apps.usuarios.serializers import UsuarioResumoSerializer
from cryptography.hazmat.primitives.serialization import pkcs12
from .crypto import criptografar_senha

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
                _, cert, _ = pkcs12.load_key_and_certificates(pfx_bytes, senha.encode())

                # Verifica CNPJ do certificado com o CNPJ da empresa
                from cryptography.x509.oid import NameOID
                subject = cert.subject
                cn = subject.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value
                # CN da NFe vem no formato "NOME EMPRESA:12345678000199"
                cnpj_cert = cn.split(':')[-1].strip() if ':' in cn else ''
                cnpj_empresa = self.instance.cnpj if self.instance else ''
                # Normaliza removendo pontuação
                cnpj_cert_num = ''.join(filter(str.isdigit, cnpj_cert))
                cnpj_empresa_num = ''.join(filter(str.isdigit, cnpj_empresa))

                if cnpj_cert_num and cnpj_empresa_num and cnpj_cert_num != cnpj_empresa_num:
                    raise serializers.ValidationError(
                        f'O certificado pertence ao CNPJ {cnpj_cert_num}, mas a empresa possui o CNPJ {cnpj_empresa_num}.'
                    )

            except serializers.ValidationError:
                raise
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