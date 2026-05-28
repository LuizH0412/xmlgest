from PySide6.QtWidgets import QSystemTrayIcon, QMenu, QApplication
from PySide6.QtGui import QIcon, QAction
from PySide6.QtCore import QObject


class TrayIcon(QObject):
    def __init__(self, config_window, watcher):
        super().__init__()
        self.config_window = config_window
        self.watcher = watcher
        self.setup_tray()

    def setup_tray(self):
        self.tray = QSystemTrayIcon()
        self.tray.setIcon(QIcon('assets/icone-novo.ico'))
        self.tray.setToolTip('Coletor — Softcom Cuiabá')

        self.menu = QMenu()

        acao_config = QAction('⚙️ Configurações')
        acao_config.triggered.connect(self.abrir_configuracoes)
        self.menu.addAction(acao_config)

        acao_status = QAction('✅ Monitorando...')
        acao_status.setEnabled(False)
        self.menu.addAction(acao_status)
        self.acao_status = acao_status

        self.menu.addSeparator()

        acao_sair = QAction('❌ Sair')
        acao_sair.triggered.connect(self.sair)
        self.menu.addAction(acao_sair)

        self.tray.setContextMenu(self.menu)
        self.tray.activated.connect(self.on_tray_activated)
        self.tray.show()

    def abrir_configuracoes(self):
        self.config_window.show()
        self.config_window.raise_()

    def sair(self):
        self.watcher.parar()
        QApplication.quit()

    def on_tray_activated(self, reason):
        if reason == QSystemTrayIcon.ActivationReason.Trigger:
            self.abrir_configuracoes()

