import sys
from PySide6.QtWidgets import QApplication
from config_manager import ConfigManager
from api_client import ApiClient
from watcher import FolderWatcher
from ui.config_window import ConfigWindow
from ui.tray import TrayIcon


def main():
    app = QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(False)  # não fecha ao fechar a janela

    # Inicializa os componentes
    config_manager = ConfigManager()
    api_client = ApiClient(config_manager)

    # Carrega as pastas configuradas
    config = config_manager.carregar()
    pastas = config.get('pastas', [])

    # Inicia o watcher se tiver pastas configuradas
    watcher = FolderWatcher(api_client, pastas)
    if pastas:
        watcher.iniciar()

    # Cria a interface
    config_window = ConfigWindow(config_manager, api_client)
    tray = TrayIcon(config_window, watcher)

    # Se não tiver configuração, abre a janela automaticamente
    if not config.get('api_url') or not config.get('client_id'):
        config_window.show()

    sys.exit(app.exec())


if __name__ == '__main__':
    main()
