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
        
        time.sleep(1)
        
        sucesso = self.api_client.upload_xml(event.src_path)

        if sucesso:
            print(f"Upload realizado: {event.src_path}")
        else:
            print(f"Falha no upload: {event.src_path}")


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
                        if sucesso:
                            print(f"Sincronizado: {caminho}")
                        else:
                            print(f"Já existe ou falhou: {caminho}")
        print("Sincronização concluída.")