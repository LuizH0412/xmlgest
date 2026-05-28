from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Empresa


class ColetorTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        client_id = request.data.get('client_id')
        client_secret = request.data.get('client_secret')

        if not client_id or not client_secret:
            return Response(
                {'detail': 'client_id e client_secret são obrigatórios.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            empresa = Empresa.objects.get(client_id=client_id)
        except Empresa.DoesNotExist:
            return Response(
                {'detail': 'Credenciais inválidas.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if empresa.client_secret != client_secret:
            return Response(
                {'detail': 'Credenciais inválidas.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if empresa.desativado:
            return Response(
                {'detail': 'Empresa desativada.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Gera o token JWT com empresa_id no payload
        refresh = RefreshToken()
        refresh['empresa_id'] = empresa.id
        refresh['codigo_interno'] = empresa.codigo_interno

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })