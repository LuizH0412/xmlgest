from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import time
import os


class XMLHandler(FileSystemEventHandler):
    def __init__(self, api_client):
        self.api_client = api_client

    def on_created(self, event):
        if event.is_directory:
            return
        if not event.src_path.endswith('.xml'):
            return

        if not self._aguardar_arquivo(event.src_path):
            print(f"Arquivo não ficou disponível: {event.src_path}")
            return

        sucesso = self.api_client.upload_xml(event.src_path)
        if sucesso:
            print(f"Upload realizado: {event.src_path}")
        else:
            print(f"Falha no upload: {event.src_path}")

    def _aguardar_arquivo(self, caminho, tentativas=10, intervalo=0.5):
        tamanho_anterior = -1
        for _ in range(tentativas):
            try:
                tamanho_atual = os.path.getsize(caminho)
                if tamanho_atual > 0 and tamanho_atual == tamanho_anterior:
                    return True
                tamanho_anterior = tamanho_atual
            except (FileNotFoundError, OSError):
                pass
            time.sleep(intervalo)
        return False


class FolderWatcher:
    def __init__(self, api_client, pastas):
        self.api_client = api_client
        self.pastas = pastas
        self.observer = Observer()

    def iniciar(self):
        self.sincronizar_existentes()
        handler = XMLHandler(self.api_client)
        for tipo, pasta in self.pastas.items():
            if pasta:
                self.observer.schedule(handler, pasta, recursive=True)
                print(f"Monitorando {tipo}: {pasta}")
        self.observer.start()
        print("Monitoramento iniciado.")

    def parar(self):
        self.observer.stop()
        self.observer.join()
        print("Monitoramento parado.")

    def sincronizar_existentes(self):
        print("Sincronizando arquivos existentes...")
        for tipo, pasta in self.pastas.items():
            if not pasta:
                continue
            for raiz, dirs, arquivos in os.walk(pasta):
                for arquivo in arquivos:
                    if arquivo.endswith('.xml'):
                        caminho = os.path.join(raiz, arquivo)
                        sucesso = self.api_client.upload_xml(caminho)
                        if sucesso is True:
                            print(f"Sincronizado: {caminho}")
                        elif sucesso is None:
                            print(f"Já existe: {caminho}")  
                        else:
                            print(f"Falhou: {caminho}") 
        print("Sincronização concluída.")