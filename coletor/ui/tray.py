from PySide6.QtWidgets import QSystemTrayIcon, QMenu, QApplication, QInputDialog, QLineEdit, QMessageBox
from PySide6.QtGui import QIcon
from PySide6.QtCore import QObject
from ui.senha_dialog import SenhaDialog
from ui.log_window import LogWindow
import sys
import os

def resource_path(relative_path):
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath('.'), relative_path)


SENHA_CONFIG = "suporte@softcom"

class TrayIcon(QObject):
    def __init__(self, config_window, watcher):
        super().__init__()
        self.config_window = config_window
        self.watcher = watcher
        self.setup_tray()
        self.log_window = LogWindow()

    def setup_tray(self):
        caminho_icone = resource_path('assets/icone-novo.ico')
        print(f"Ícone: {caminho_icone} | Existe: {os.path.exists(caminho_icone)}")

        self.tray = QSystemTrayIcon()
        self.tray.setIcon(QIcon(resource_path('assets/icone-novo.ico')))
        self.tray.setToolTip('Coletor — Softcom Cuiabá')

        self.menu = QMenu()

        self.menu.addAction('⚙️ Configurações').triggered.connect(lambda: self.pedir_senha(self.abrir_configuracoes))

        self.menu.addAction('📋 Ver Logs').triggered.connect(lambda: self.pedir_senha(self.abrir_logs))

        self.acao_status = self.menu.addAction('✅ Monitorando...')
        self.acao_status.setEnabled(False)

        self.menu.addSeparator()

        self.menu.addAction('❌ Encerrar').triggered.connect(lambda: self.pedir_senha(self.sair))

        self.tray.setContextMenu(self.menu)
        self.tray.activated.connect(self.on_tray_activated)
        self.tray.show()

    def pedir_senha(self, callback):
        if self.config_window.isVisible():
            return  # ignora se a janela já estiver aberta
        
        dialog = SenhaDialog()
        while True:
            if dialog.exec() == SenhaDialog.DialogCode.Accepted:
                if dialog.get_senha() == SENHA_CONFIG:
                    callback()
                    break
                else:
                    dialog.mostrar_erro()
            else:
                break

    def abrir_configuracoes(self):
        self.config_window.show()
        self.config_window.raise_()

    def sair(self):
        self.watcher.parar()
        QApplication.quit()

    def on_tray_activated(self, reason):
        if reason == QSystemTrayIcon.ActivationReason.Trigger:
            self.pedir_senha()

    def abrir_logs(self):
        self.log_window.show()
        self.log_window.raise_()