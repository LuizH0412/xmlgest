from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Documento
from core.permissions import PaginacaoPadrao
from .serializers import DocumentoSerializer
from core.permissions import IsAdmin
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from apps.empresas.models import Empresa
from .services import extrair_dados
from .filters import DocumentoFilter
from django.utils import timezone
from apps.empresas.authentication import ColetorUser
import os


class DocumentoViewSet(viewsets.ModelViewSet):
    pagination_class = PaginacaoPadrao
    filterset_class = DocumentoFilter
    queryset = Documento.objects.all()
    serializer_class = DocumentoSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create', 'upload']:
            return [IsAuthenticated()]
        return [IsAdmin()]

    def destroy(self, request, *args, **kwargs):
        return Response(
            {'detail': 'Documentos Fiscais não podem ser deletados'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    @action(detail=False, methods=['post'], url_path='upload', parser_classes=[MultiPartParser])
    def upload(self, request):
        arquivo = request.FILES.get('arquivo')

        if not arquivo:
            return Response(
                {'detail': 'Nenhum arquivo enviado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            dados = extrair_dados(arquivo)
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verifica duplicata
        if Documento.objects.filter(chave_acesso=dados['chave_acesso']).exists():
            return Response(
                {'detail': 'Documento já existe no sistema.'},
                status=status.HTTP_409_CONFLICT
            )

        # Identifica a empresa pelo CNPJ
        try:
            empresa = Empresa.objects.get(cnpj=dados['cnpj_emitente'])
        except Empresa.DoesNotExist:
            return Response(
                {'detail': 'Empresa não encontrada para o CNPJ informado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Salva o arquivo
        data = dados['data_emissao']
        caminho = f"xmls/{empresa.codigo_interno}/{dados['tipo']}/{data.year}/{data.month:02d}/{arquivo.name}"
        caminho_completo = os.path.join('media', caminho)
        os.makedirs(os.path.dirname(caminho_completo), exist_ok=True)
        with open(caminho_completo, 'wb+') as destino:
            for chunk in arquivo.chunks():
                destino.write(chunk)

        # Salva no banco
        enviado_por = None if isinstance(request.user, ColetorUser) else request.user

        documento = Documento.objects.create(
            empresa=empresa,
            chave_acesso=dados['chave_acesso'],
            tipo=dados['tipo'],
            numero_nota=dados['numero_nota'],
            serie=dados['serie'],
            data_emissao=dados['data_emissao'],
            valor_total=dados['valor_total'],
            status=dados['status'],
            caminho_arquivo=caminho,
            enviado_por=enviado_por,
        )

        return Response(
            {'detail': 'Documento enviado com sucesso.', 'id': documento.id},
            status=status.HTTP_201_CREATED
        )
