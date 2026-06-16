import os
import sys
from datetime import datetime


LOG_FILE = os.path.join(os.path.dirname(sys.executable) if hasattr(sys, '_MEIPASS') else os.path.abspath('.'), 'coletor.log')

_listeners = []

def adicionar_listener(callback):
    _listeners.append(callback)

def remover_listener(callback):
    if callback in _listeners:
        _listeners.remove(callback)

def log(mensagem, nivel='INFO'):
    agora = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
    linha = f"[{agora}] [{nivel}] {mensagem}"

    # Grava no arquivo
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(linha + '\n')

    # Notifica listeners (tela de log)
    for callback in _listeners:
        try:
            callback(linha, nivel)
        except Exception:
            pass

    print(linha)