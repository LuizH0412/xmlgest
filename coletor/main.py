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

    pastas = config.get('pastas', {})  

    watcher = FolderWatcher(api_client, pastas)
    if any(pastas.values()):  # ← só inicia se tiver ao menos uma pasta preenchida
        watcher.iniciar()

    config_window = ConfigWindow(config_manager, api_client)
    tray = TrayIcon(config_window, watcher)

    app.aboutToQuit.connect(watcher.parar)

    if not config.get('client_id') or not config.get('client_secret'):
        config_window.show()

    sys.exit(app.exec())


if __name__ == '__main__':
    main()
