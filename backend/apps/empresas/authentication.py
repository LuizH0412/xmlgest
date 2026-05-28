from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken
from apps.empresas.models import Empresa


class ColetorUser:
    """Objeto que simula um usuário autenticado para o coletor."""
    def __init__(self, empresa):
        self.empresa = empresa
        self.is_authenticated = True
        self.id = f"coletor_{empresa.id}"
        self.perfil = 'coletor'
        
    def __str__(self):
        return f"Coletor:{self.empresa.codigo_interno}"


class ColetorAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token_str = auth_header.split(' ')[1]

        try:
            token = AccessToken(token_str)
            empresa_id = token.get('empresa_id')
            if not empresa_id:
                return None 

            empresa = Empresa.objects.get(id=empresa_id)
            return (ColetorUser(empresa), token)

        except Exception:
            return None 