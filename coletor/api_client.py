import requests
from settings import API_URL

class ApiClient:
    def __init__(self, config_manager):
        self.config_manager = config_manager

    def autenticar(self):
        try:
            config = self.config_manager.carregar()
            response = requests.post(
                f"{API_URL}/api/token/coletor/",
                json={
                    'client_id': config['client_id'],
                    'client_secret': config['client_secret']
                }
            )
            if response.status_code == 200:
                token = response.json()['access']
                self.config_manager.salvar_token(token)
                return True
            return False
        except requests.exceptions.ConnectionError:
            return False

    def upload_xml(self, caminho_arquivo, _retry=True):  # ← flag de retry
        try:
            token = self.config_manager.recuperar_token()
            with open(caminho_arquivo, 'rb') as f:
                headers = {'Authorization': f'Bearer {token}'}
                response = requests.post(
                    f"{API_URL}/api/documentos/upload/",
                    headers=headers,
                    files={'arquivo': f}
                )

            print(f"Status: {response.status_code} | {caminho_arquivo}")  # ← adicione isso

            if response.status_code == 201:
                return True
            elif response.status_code == 409:
                print(f"Duplicata ignorada: {caminho_arquivo}")
                return None  # ← None = já existe (não é falha)
            elif response.status_code == 401 and _retry:
                if self.autenticar():
                    return self.upload_xml(caminho_arquivo, _retry=False)
            return False
        except requests.exceptions.ConnectionError:
            return False

    def token_valido(self):
        token = self.config_manager.recuperar_token()
        if not token:
            return False
        try:
            response = requests.get(
                f"{API_URL}/api/usuarios/",
                headers={'Authorization': f'Bearer {token}'}
            )
            return response.status_code != 401
        except requests.exceptions.ConnectionError:
            return False