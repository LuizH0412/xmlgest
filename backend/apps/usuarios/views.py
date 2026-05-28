from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Usuario
from .serializers import UsuarioSerializer
from core.permissions import IsAdminOrSupervisao

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrSupervisao()]
        return super().get_permissions()
    
    def destroy(self, request, *args, **kwargs):
        usuario = self.get_object()
        usuario.desativado = True
        usuario.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def perform_create(self, serializer):
        serializer.save(cadastrado_por=self.request.user)