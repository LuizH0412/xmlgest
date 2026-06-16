from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from .models import Auditoria
from .serializers import AuditoriaSerializer
from core.permissions import PaginacaoPadrao, IsAdmin
from django_filters.rest_framework import DjangoFilterBackend


class AuditoriaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditoriaSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = PaginacaoPadrao
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['empresa', 'usuario', 'acao']
    ordering = ['-criado_em']

    def get_queryset(self):
        return Auditoria.objects.select_related('usuario', 'empresa').all()