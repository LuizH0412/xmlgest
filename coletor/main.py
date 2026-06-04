import sys
from PySide6.QtWidgets import QApplication
from config_manager import ConfigManager
from api_client import ApiClient
from watcher import FolderWatcher
from ui.config_window import ConfigWindow
from ui.tray import TrayIcon


def main():
    app = QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(False)

    config_manager = ConfigManager()
    api_client = ApiClient(config_manager)

    config = config_manager.carregar()
    print("Config carregada:", config)         # ← ver o que veio
    pastas = config.get('pastas', {})  # ← garante dict, não lista
    print("Pastas:", pastas)                   # ← ver as pastas
    print("Any:", any(pastas.values()))        # ← ver se entra no if

    watcher = FolderWatcher(api_client, pastas)
    if any(pastas.values()):  # ← só inicia se tiver ao menos uma pasta preenchida
        watcher.iniciar()

    config_window = ConfigWindow(config_manager, api_client)
    tray = TrayIcon(config_window, watcher)

    # ← CRÍTICO: garante que o watcher para limpo ao fechar o app
    app.aboutToQuit.connect(watcher.parar)

    if not config.get('api_url') or not config.get('client_id'):
        config_window.show()

    sys.exit(app.exec())


if __name__ == '__main__':
    main()
