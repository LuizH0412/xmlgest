from PySide6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QTextEdit, QLabel
from PySide6.QtGui import QIcon, QFont
from PySide6.QtCore import Qt, Signal, QObject
import logger
import os


class LogSignal(QObject):
    nova_linha = Signal(str, str)


class LogWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.signal = LogSignal()
        self.signal.nova_linha.connect(self.adicionar_linha)
        self.setup_ui()
        logger.adicionar_listener(self._receber_log)
        self.carregar_logs_existentes()

    def setup_ui(self):
        self.setWindowTitle('Coletor — Log de Atividades')
        self.setMinimumSize(640, 400)
        self.setStyleSheet("""
            QWidget { background-color: #1E1E2E; color: #FFFFFF; font-family: Arial; font-size: 13px; }
            QTextEdit { background-color: #12121E; border: 1px solid #444466; border-radius: 6px; padding: 8px; color: #CCCCCC; }
            QPushButton { background-color: #2D2D3F; color: #FFFFFF; border: 1px solid #444466; border-radius: 6px; padding: 8px 16px; }
            QPushButton:hover { background-color: #3D3D50; }
            QPushButton#btn_limpar { background-color: #3D1E1E; color: #FF6666; border-color: #662222; }
            QPushButton#btn_limpar:hover { background-color: #4D2E2E; }
        """)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(10)

        # Header
        header = QHBoxLayout()
        titulo = QLabel('📋 Log de Atividades')
        titulo.setStyleSheet('font-size: 16px; font-weight: bold; color: #F5B700;')
        header.addWidget(titulo)
        header.addStretch()

        btn_abrir_pasta = QPushButton('📁 Abrir arquivo de log')
        btn_abrir_pasta.clicked.connect(self.abrir_arquivo_log)
        header.addWidget(btn_abrir_pasta)

        btn_limpar = QPushButton('🗑️ Limpar')
        btn_limpar.setObjectName('btn_limpar')
        btn_limpar.clicked.connect(self.limpar)
        header.addWidget(btn_limpar)

        btn_atualizar = QPushButton('🔄 Atualizar')
        btn_atualizar.clicked.connect(self.recarregar)
        header.addWidget(btn_atualizar)

        layout.addLayout(header)

        # Área de log
        self.texto = QTextEdit()
        self.texto.setReadOnly(True)
        self.texto.setFont(QFont('Consolas', 11))
        layout.addWidget(self.texto)

    def _receber_log(self, linha, nivel):
        # Chamado de outra thread — usa signal para thread safety
        self.signal.nova_linha.emit(linha, nivel)

    def adicionar_linha(self, linha, nivel):
        cores = {
            'OK':    '#4CAF50',
            'ERRO':  '#FF5555',
            'AVISO': '#F5B700',
            'INFO':  '#AAAAAA',
        }
        cor = cores.get(nivel, '#CCCCCC')
        self.texto.append(f'<span style="color:{cor}">{linha}</span>')
        self.texto.verticalScrollBar().setValue(self.texto.verticalScrollBar().maximum())

    def carregar_logs_existentes(self):
        if os.path.exists(logger.LOG_FILE):
            with open(logger.LOG_FILE, 'r', encoding='utf-8') as f:
                for linha in f.readlines()[-200:]:  # últimas 200 linhas
                    nivel = 'INFO'
                    if '[OK]' in linha:
                        nivel = 'OK'
                    elif '[ERRO]' in linha:
                        nivel = 'ERRO'
                    elif '[AVISO]' in linha:
                        nivel = 'AVISO'
                    self.adicionar_linha(linha.strip(), nivel)

    def limpar(self):
        self.texto.clear()

    def abrir_arquivo_log(self):
        os.startfile(logger.LOG_FILE)

    def closeEvent(self, event):
        logger.remover_listener(self._receber_log)
        super().closeEvent(event)

    def recarregar(self):
        self.texto.clear()
        self.carregar_logs_existentes()

    def showEvent(self, event):
        self.recarregar()
        super().showEvent(event)