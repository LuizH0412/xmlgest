from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel,
    QLineEdit, QPushButton, QFileDialog, QMessageBox, QGroupBox
)
from PySide6.QtGui import QIcon
from PySide6.QtCore import Qt
import sys
import os


def resource_path(relative_path):
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath('.'), relative_path)


STYLE = """
    QWidget {
        background-color: #1E1E2E;
        color: #FFFFFF;
        font-family: Arial;
        font-size: 13px;
    }
    QLineEdit {
        background-color: #2D2D3F;
        border: 1px solid #444466;
        border-radius: 6px;
        padding: 8px;
        color: #FFFFFF;
    }
    QLineEdit:focus {
        border: 1px solid #F5B700;
    }
    QPushButton {
        background-color: #F5B700;
        color: #1E1E2E;
        border: none;
        border-radius: 6px;
        padding: 10px;
        font-weight: bold;
    }
    QPushButton:hover {
        background-color: #FFD000;
    }
    QPushButton#btn_secundario {
        background-color: #2D2D3F;
        color: #FFFFFF;
    }
    QPushButton#btn_secundario:hover {
        background-color: #3D3D50;
    }
    QGroupBox {
        border: 1px solid #444466;
        border-radius: 6px;
        margin-top: 8px;
        padding: 8px;
        font-weight: bold;
        color: #F5B700;
    }
    QLabel#titulo {
        font-size: 18px;
        font-weight: bold;
        color: #F5B700;
        padding: 8px 0px;
    }
"""


class ConfigWindow(QWidget):
    def __init__(self, config_manager, api_client):
        super().__init__()
        self.config_manager = config_manager
        self.api_client = api_client
        self.campos_pasta = {}
        self.setup_ui()
        self.carregar_configuracoes()

    def setup_ui(self):
        self.setWindowTitle('Coletor — Softcom')
        self.setMinimumWidth(520)
        self.setStyleSheet(STYLE)
        self.setWindowIcon(QIcon(resource_path('assets/icone-novo.ico')))

        layout = QVBoxLayout()
        layout.setSpacing(10)
        layout.setContentsMargins(20, 20, 20, 20)
        self.setLayout(layout)

        # Título
        titulo = QLabel('Coletor — Configuração do Coletor')
        titulo.setObjectName('titulo')
        layout.addWidget(titulo)

        # Credenciais
        grupo_credenciais = QGroupBox('Credenciais da Empresa')
        cred_layout = QVBoxLayout()
        grupo_credenciais.setLayout(cred_layout)

        cred_layout.addWidget(QLabel('Client ID:'))
        self.campo_client_id = QLineEdit()
        cred_layout.addWidget(self.campo_client_id)

        cred_layout.addWidget(QLabel('Client Secret:'))
        self.campo_client_secret = QLineEdit()
        self.campo_client_secret.setEchoMode(QLineEdit.EchoMode.Password)
        cred_layout.addWidget(self.campo_client_secret)

        layout.addWidget(grupo_credenciais)

        # Pastas por tipo
        grupo_pastas = QGroupBox('Pastas Monitoradas')
        pastas_layout = QVBoxLayout()
        grupo_pastas.setLayout(pastas_layout)

        for tipo in ['NFe', 'NFCe']:
            tipo_layout = QHBoxLayout()

            label = QLabel(f'{tipo}:')
            label.setFixedWidth(50)
            tipo_layout.addWidget(label)

            campo = QLineEdit()
            campo.setPlaceholderText(f'Caminho da pasta de {tipo}')
            tipo_layout.addWidget(campo)

            btn = QPushButton('📁')
            btn.setFixedWidth(40)
            btn.setObjectName('btn_secundario')
            btn.clicked.connect(lambda checked, t=tipo, c=campo: self.selecionar_pasta(t, c))
            tipo_layout.addWidget(btn)

            self.campos_pasta[tipo] = campo
            pastas_layout.addLayout(tipo_layout)

        layout.addWidget(grupo_pastas)

        # Botões principais
        self.btn_testar = QPushButton('Testar Conexão')
        layout.addWidget(self.btn_testar)

        self.btn_salvar = QPushButton('Salvar Configurações')
        layout.addWidget(self.btn_salvar)

        # Conecta botões
        self.btn_testar.clicked.connect(self.testar_conexao)
        self.btn_salvar.clicked.connect(self.salvar)

    def selecionar_pasta(self, tipo, campo):
        pasta = QFileDialog.getExistingDirectory(self, f'Selecionar pasta de {tipo}')
        if pasta:
            campo.setText(pasta)

    def carregar_configuracoes(self):
        config = self.config_manager.carregar()
        self.campo_client_id.setText(config.get('client_id', ''))
        self.campo_client_secret.setText(config.get('client_secret', ''))
        pastas = config.get('pastas', {})
        for tipo, campo in self.campos_pasta.items():
            campo.setText(pastas.get(tipo, ''))

    def testar_conexao(self):
        # Salva silenciosamente sem popup
        pastas = {}
        for tipo, campo in self.campos_pasta.items():
            pastas[tipo] = campo.text()

        config = {
            'client_id': self.campo_client_id.text(),
            'client_secret': self.campo_client_secret.text(),
            'pastas': pastas
        }
        self.config_manager.salvar(config)

        # Testa a conexão
        sucesso = self.api_client.autenticar()
        if sucesso:
            QMessageBox.information(self, 'Sucesso', '✅ Conexão estabelecida com sucesso!')
        else:
            QMessageBox.critical(self, 'Erro', '❌ Falha na conexão. Verifique as credenciais.')

    def salvar(self):
        pastas = {}
        for tipo, campo in self.campos_pasta.items():
            pastas[tipo] = campo.text()

        config = {
            'client_id': self.campo_client_id.text(),
            'client_secret': self.campo_client_secret.text(),
            'pastas': pastas
        }
        self.config_manager.salvar(config)
        QMessageBox.information(self, 'Salvo', 'Configurações salvas com sucesso!')