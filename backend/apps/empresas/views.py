from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Empresa
from core.permissions import PaginacaoPadrao
from django.utils import timezone
from datetime import timedelta
from .serializers import EmpresaSerializer, EmpresaCertificadoSerializer
from apps.documentos.models import Documento
from core.permissions import IsAdminOrSupervisao
from django.http import FileResponse
import os


class EmpresaViewSet(viewsets.ModelViewSet):
    lookup_field = 'codigo_interno'  # <-- usa codigo_interno em todas as rotas
    pagination_class = PaginacaoPadrao
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrSupervisao()]

    def destroy(self, request, *args, **kwargs):
        empresa = self.get_object()
        empresa.desativado = True
        empresa.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_create(self, serializer):
        serializer.save(cadastrado_por=self.request.user)

    @action(detail=True, methods=['patch'], url_path='certificado', parser_classes=[MultiPartParser])
    def upload_certificado(self, request, codigo_interno=None):
        empresa = self.get_object()
        serializer = EmpresaCertificadoSerializer(empresa, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            empresa.refresh_from_db()
            return Response({'detail': 'Certificado salvo com sucesso.', 'validade': str(empresa.certificado_validade)})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='certificado/download')
    def download_certificado(self, request, codigo_interno=None):
        empresa = self.get_object()

        if not empresa.certificado_pfx:
            return Response(
                {'detail': 'Nenhum certificado cadastrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        caminho = empresa.certificado_pfx.path

        if not os.path.exists(caminho):
            return Response(
                {'detail': 'Arquivo não encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        return FileResponse(
            open(caminho, 'rb'),
            as_attachment=True,
            filename=f"certificado_{empresa.cnpj}.pfx",
            content_type='application/x-pkcs12'
        )
    
    @action(detail=True, methods=['patch'], url_path='certificado/remover')
    def remover_certificado(self, request, codigo_interno=None):
        empresa = self.get_object()
        if empresa.certificado_pfx:
            empresa.certificado_pfx.delete(save=False)
        empresa.certificado_pfx = None
        empresa.certificado_senha = None
        empresa.certificado_validade = None
        empresa.save()
        return Response({'detail': 'Certificado removido com sucesso.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def empresas_sem_xml(request):
    cinco_dias_atras = timezone.now() - timedelta(days=5)
    empresas_ativas = Empresa.objects.filter(desativado=False)

    alertas = []
    for empresa in empresas_ativas:
        ultimo_xml = Documento.objects.filter(
            empresa=empresa
        ).order_by('-criado_em').first()

        if not ultimo_xml or ultimo_xml.criado_em < cinco_dias_atras:
            alertas.append({
                'id': empresa.id,
                'nome': empresa.nome_fantasia,
                'codigo_interno': empresa.codigo_interno,
                'ultimo_xml': ultimo_xml.criado_em if ultimo_xml else None,
            })

    return Response(alertas)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def empresa_por_codigo(request, codigo):
    try:
        empresa = Empresa.objects.get(codigo_interno=codigo)
        from .serializers import EmpresaSerializer, EmpresaCredenciaisSerializer
        dados = EmpresaSerializer(empresa).data
        credenciais = EmpresaCredenciaisSerializer(empresa).data
        dados['client_id'] = credenciais['client_id']
        dados['client_secret'] = credenciais['client_secret']
        dados['certificado_validade'] = str(empresa.certificado_validade) if empresa.certificado_validade else None
        return Response(dados)
    except Empresa.DoesNotExist:
        return Response({'detail': 'Empresa não encontrada.'}, status=404)