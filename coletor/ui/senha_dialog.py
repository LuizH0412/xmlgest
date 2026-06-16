from PySide6.QtWidgets import QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton, QWidget
from PySide6.QtCore import Qt
from PySide6.QtGui import QIcon


class SenhaDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle('Acesso Restrito')
        self.setWindowIcon(QIcon('assets/icone-novo.ico'))
        self.setFixedWidth(340)
        self.setWindowFlags(self.windowFlags() & ~Qt.WindowContextHelpButtonHint)
        self.erro_visivel = False
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(0)

        # Header
        header = QHBoxLayout()
        header.setSpacing(12)

        icone_container = QLabel()
        icone_container.setFixedSize(40, 40)
        icone_container.setAlignment(Qt.AlignCenter)
        icone_container.setText('🔒')
        icone_container.setStyleSheet('''
            QLabel {
                background-color: #f3f4f6;
                border-radius: 8px;
                font-size: 18px;
            }
        ''')

        textos = QVBoxLayout()
        textos.setSpacing(2)
        titulo = QLabel('Acesso restrito')
        titulo.setStyleSheet('font-size: 15px; font-weight: 600; color: #111827;')
        subtitulo = QLabel('Digite a senha para continuar')
        subtitulo.setStyleSheet('font-size: 13px; color: #6b7280;')
        textos.addWidget(titulo)
        textos.addWidget(subtitulo)

        header.addWidget(icone_container)
        header.addLayout(textos)
        layout.addLayout(header)
        layout.addSpacing(20)

        # Input
        self.input_senha = QLineEdit()
        self.input_senha.setPlaceholderText('Senha')
        self.input_senha.setEchoMode(QLineEdit.EchoMode.Password)
        self.input_senha.setFixedHeight(36)
        self.input_senha.setStyleSheet('''
            QLineEdit {
                border: 1px solid #d1d5db;
                border-radius: 8px;
                padding: 0 12px;
                font-size: 14px;
                color: #111827;
                background: #ffffff;
            }
            QLineEdit:focus {
                border-color: #6b7280;
            }
        ''')
        self.input_senha.returnPressed.connect(self.confirmar)
        layout.addWidget(self.input_senha)
        layout.addSpacing(8)

        # Aviso de erro (oculto inicialmente)
        self.aviso_erro = QLabel('Senha incorreta. Dica: use a senha do PDV.')
        self.aviso_erro.setWordWrap(True)
        self.aviso_erro.setStyleSheet('''
            QLabel {
                background-color: #fef2f2;
                color: #b91c1c;
                border-radius: 8px;
                padding: 8px 10px;
                font-size: 13px;
            }
        ''')
        self.aviso_erro.hide()
        layout.addWidget(self.aviso_erro)
        layout.addSpacing(16)

        # Botões
        botoes = QHBoxLayout()
        botoes.setSpacing(8)

        btn_cancelar = QPushButton('Cancelar')
        btn_cancelar.setFixedHeight(36)
        btn_cancelar.setStyleSheet('''
            QPushButton {
                border: 1px solid #d1d5db;
                border-radius: 8px;
                font-size: 14px;
                color: #6b7280;
                background: transparent;
            }
            QPushButton:hover {
                background-color: #f9fafb;
            }
        ''')
        btn_cancelar.clicked.connect(self.reject)

        btn_confirmar = QPushButton('Confirmar')
        btn_confirmar.setFixedHeight(36)
        btn_confirmar.setStyleSheet('''
            QPushButton {
                border: 1px solid #1a1a1a;
                border-radius: 8px;
                font-size: 14px;
                color: #ffffff;
                background-color: #1a1a1a;
            }
            QPushButton:hover {
                background-color: #333333;
            }
        ''')
        btn_confirmar.clicked.connect(self.confirmar)

        botoes.addWidget(btn_cancelar)
        botoes.addWidget(btn_confirmar)
        layout.addLayout(botoes)

    def confirmar(self):
        self.accept()

    def get_senha(self):
        return self.input_senha.text()

    def mostrar_erro(self):
        self.aviso_erro.show()
        self.input_senha.setStyleSheet('''
            QLineEdit {
                border: 1px solid #f87171;
                border-radius: 8px;
                padding: 0 12px;
                font-size: 14px;
                color: #111827;
                background: #ffffff;
            }
            QLineEdit:focus {
                border-color: #f87171;
            }
        ''')
        self.input_senha.clear()
        self.input_senha.setFocus()
        self.adjustSize()