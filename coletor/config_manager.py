import json
import os
import keyring

APP_NAME = 'XMLGest'


class ConfigManager:
    def __init__(self):
        # Pasta AppData\Roaming\XMLGest
        app_data = os.environ.get('APPDATA', os.path.expanduser('~'))
        self.config_dir = os.path.join(app_data, APP_NAME)
        self.config_file = os.path.join(self.config_dir, 'config.json')
        
        # Cria a pasta se não existir
        os.makedirs(self.config_dir, exist_ok=True)

    def carregar(self):
        if not os.path.exists(self.config_file):
            return {
                'client_id': '',
                'client_secret': '',
                'pastas': {
                    'NFe': '',
                    'NFCe': '',
                    'CTe': '',
                    'MDFe': ''
                }
            }
        with open(self.config_file, 'r') as f:
                return json.load(f)

    def salvar(self, config):
        with open(self.config_file, 'w') as f:
            json.dump(config, f, indent=4)

    def salvar_token(self, token):
        keyring.set_password(APP_NAME, 'jwt_token', token)

    def recuperar_token(self):
        return keyring.get_password(APP_NAME, 'jwt_token')