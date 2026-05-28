from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Empresa
from core.permissions import PaginacaoPadrao
from django.utils import timezone
from datetime import timedelta
from .serializers import EmpresaSerializer
from apps.documentos.models import Documento
from core.permissions import IsAdminOrSupervisao


class EmpresaViewSet(viewsets.ModelViewSet):
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
        return Response(dados)
    except Empresa.DoesNotExist:
        return Response({'detail': 'Empresa não encontrada.'}, status=404)