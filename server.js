const express = require('express');
const YouTube = require("youtube-sr").default;
const fs = require('fs');
const path = require("path");
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/download', async (req, res) => {
    const { query, fileType } = req.query;

    try {
        const { videoData, filePath, fileExtension } = await Youtoba(query, 10, fileType);
        
        if (filePath) {
            // Retorna o caminho do arquivo baixado junto com os dados do vídeo
            res.json({ success: true, videoData, filePath, fileExtension });
        } else {
            res.json({ success: false, message: "Nenhum vídeo ou áudio encontrado." });
        }
    } catch (error) {
        console.error("Erro ao baixar o vídeo:", error);
        res.status(500).json({ success: false, message: "Ocorreu um erro ao processar o pedido." });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});

// Função Youtoba e outras funções aqui...

function carregarEExcluirConteudo() {
    const diretorio = "./temparchv";

    // Verifica se é um diretório
    fs.stat(diretorio, (err, stats) => {
        if (err) {
            console.error("Erro ao acessar o diretório:", err);
            return;
        }

        if (!stats.isDirectory()) {
            console.error("O caminho especificado não é um diretório.");
            return;
        }

        // Exclui o conteúdo do diretório
        fs.readdir(diretorio, (err, files) => {
            if (err) {
                console.error("Erro ao ler o conteúdo do diretório:", err);
                return;
            }

            files.forEach(file => {
                const filePath = path.join(diretorio, file);
                fs.unlink(filePath, err => {
                    if (err) {
                        console.error(`Erro ao excluir o arquivo ${filePath}:`, err);
                    } else {
                        console.log(`Arquivo ${filePath} excluído com sucesso.`);
                    }
                });
            });
        });
    });
}

// Verificar se é uma url
const isUrl = (url) => {
    return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'))
}

// Baixar video/audio a partir de um termo de pesquisa ou link do youtube
// deixa pelo menos meus cr3ditos na func, prfvr🥺
async function Youtoba(query, limit, fileType) {
    return new Promise(async (resolve, reject) => {
        try {
            // Limpa a query removendo caracteres indesejados e espaços em branco
            query = query.replace(/\/$|\.mp3|\.mp4|mp3|mp4/gi, '').trim();
            
            // Verifica se a query é uma URL
            if (isUrl(query)) {
                const videoUrl = query;
                console.log(videoUrl);
                // Obtém informações do vídeo a partir da URL
                const videoInfo = await YouTube.getVideo(videoUrl);
                
                // Cria um objeto com os dados do vídeo
                const videoData = {
                    title: videoInfo.title,
                    description: (videoInfo.description || '').replace(/\n/g, '').substring(0, 100) + ((videoInfo.description || '').length > 100 ? '[...]' : ''),
                    uploadedAt: videoInfo.uploadedAt,
                    views: videoInfo.views,
                    duracao: videoInfo.durationFormatted,
                    likes: videoInfo.likes,
                    dislikes: videoInfo.dislikes,
                    thumbnail: videoInfo.thumbnail.url,
                    url: videoUrl
                };
                
                // Determina a extensão do arquivo com base no tipo especificado
                let fileExtension = '';
                if (fileType === 'mp3' || fileType === '.mp3') {
                    fileExtension = '.mp3';
                } else if (fileType === 'mp4' || fileType === '.mp4') {
                    fileExtension = '.mp4';
                } else if (fileType === 'audio') {
                    fileExtension = '.mp3';
                } else if (fileType === 'video') {
                    fileExtension = '.mp4';
                }
                
                // Cria um nome de arquivo único para salvar temporariamente os dados do vídeo
                const fileName = `../public/temparchv/video_${Date.now()}.json`;
                // Escreve os dados do vídeo em um arquivo JSON
                fs.writeFileSync(fileName, JSON.stringify({ url: videoUrl, fileExtension }));
                
                // Executa um script Python para baixar o vídeo
                const pythonScriptPath = path.join(__dirname, '../public/ytdownloader', 'main.py');
                exec(`python ${pythonScriptPath} ${fileName} ${fileExtension}`, async (error, stdout, stderr) => {
                    if (error) {
                        console.error('Erro ao chamar o script Python:', error);
                        reject(error);
                        return;
                    }
                    
                    // Retorna o caminho do arquivo baixado junto com os dados do vídeo
                    const filePath = fileName.replace('.json', fileExtension);
                    resolve({ videoData, filePath, fileExtension });
                });
            } else {
                // Busca vídeos semelhantes se a query não for uma URL
                const videos = await YouTube.search(query, { limit });
                
                if (videos.length > 0) {
                    let maxSimilarity = 0;
                    let mostSimilarVideo = null;
                    // Encontra o vídeo mais semelhante à query fornecida (opcional)
                    videos.forEach(video => {
                        const titleWords = video.title.toLowerCase().split(' ');
                        const queryWords = query.toLowerCase().split(' ');
                        let similarityCount = 0;
                        queryWords.forEach(word => {
                            if (titleWords.includes(word)) {
                                similarityCount++;
                            }
                        });
                        if (similarityCount > maxSimilarity) {
                            maxSimilarity = similarityCount;
                            mostSimilarVideo = video;
                        }
                    });
                    
                    if (mostSimilarVideo) {
                        const videoUrl = mostSimilarVideo.url;
                        
                        // Obtém informações do vídeo mais semelhante
                        const videoInfo = await YouTube.getVideo(videoUrl);
                        
                        // Cria um objeto com os dados do vídeo
                        const videoData = {
                            title: videoInfo.title,
                            description: (videoInfo.description || '').replace(/\n/g, '').substring(0, 100) + ((videoInfo.description || '').length > 100 ? '[...]' : ''),
                            uploadedAt: videoInfo.uploadedAt,
                            views: videoInfo.views,
                            duracao: videoInfo.durationFormatted,
                            likes: videoInfo.likes,
                            dislikes: videoInfo.dislikes,
                            thumbnail: videoInfo.thumbnail.url,
                            url: videoUrl
                        };

                        // Determina a extensão do arquivo com base no tipo especificado
                        let fileExtension = '';
                        if (fileType === 'mp3' || fileType === '.mp3') {
                            fileExtension = '.mp3';
                        } else if (fileType === 'mp4' || fileType === '.mp4') {
                            fileExtension = '.mp4';
                        } else if (fileType === 'audio') {
                            fileExtension = '.mp3';
                        } else if (fileType === 'video') {
                            fileExtension = '.mp4';
                        }
                        
                        // Cria um nome de arquivo único para salvar temporariamente os dados do vídeo
                        const fileName = `./public/temparchv/video_${Date.now()}.json`;
                        // Escreve os dados do vídeo em um arquivo JSON
                        fs.writeFileSync(fileName, JSON.stringify({ url: videoUrl, fileExtension }));
                        
                        // Executa um script Python para baixar o vídeo
                        const pythonScriptPath = path.join(__dirname, './public/ytdownloader', 'main.py');
                        exec(`python ${pythonScriptPath} ${fileName} ${fileExtension}`, async (error, stdout, stderr) => {
                            if (error) {
                                console.error('Erro ao chamar o script Python:', error);
                                reject(error);
                                return;
                            }
    
                            // Retorna o caminho do arquivo baixado junto com os dados do vídeo
                            const filePath = fileName.replace('.json', fileExtension);
                            resolve({ videoData, filePath, fileExtension });
                        });
                    } else {
                        resolve(null);
                    }
                    
                } else {
                    resolve(null);
                }
            }
        } catch (error) {
            console.error("Erro ao buscar vídeos:", error);
            reject(error);
        }
    });
}
