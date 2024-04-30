import json
import sys
from pytube import YouTube
import os.path

# Função para baixar vídeo ou áudio
def baixar_midia(url, nome_arquivo, fileExtension):
    try:
        yt = YouTube(url)
        if fileExtension == '.mp3':
            # Baixar apenas o áudio do vídeo
            stream = yt.streams.filter(only_audio=True).first()
        elif fileExtension == '.mp4':
            # Baixar a melhor stream progressiva disponível
            stream = yt.streams.filter(progressive=True).first()
        else:
            print("Tipo de mídia não suportado. Use 'mp3' ou 'mp4'.")
            return
        
        # Adiciona a extensão correta ao nome do arquivo
        nome_arquivo_com_extensao = f"{nome_arquivo}{fileExtension}"

        stream.download(output_path='.', filename=nome_arquivo_com_extensao)
        print("Download completo!")
    except Exception as e:
        print("Ocorreu um erro durante o download:", str(e))

# Obter o nome do arquivo e o tipo de mídia do argumento da linha de comando
if len(sys.argv) < 3:
    print("Por favor, forneça o nome do arquivo JSON e o tipo de mídia como argumentos.")
    sys.exit(1)

nome_arquivo = sys.argv[1]
fileExtension = sys.argv[2]

# Ler o URL do vídeo do arquivo JSON
with open(nome_arquivo, 'r') as file:
    data = json.load(file)
    url_video = data['url']

# Chamada da função para baixar a mídia
baixar_midia(url_video, nome_arquivo.replace('.json', ''), fileExtension)
