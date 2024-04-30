async function downloadVideo() {
    const query = document.getElementById('query').value;
    const fileType = document.getElementById('fileType').value;
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '';

    try {
        const response = await fetch(`/download?query=${encodeURIComponent(query)}&fileType=${fileType}`);
        const data = await response.json();

        if (data.success) {
            const { videoData, filePath, fileExtension } = data;
            const { title, description, uploadedAt, views, duracao, thumbnail, url } = videoData;

            const videoElement = document.createElement('video');
            videoElement.src = filePath;
            videoElement.controls = true;

            outputDiv.innerHTML = `
                <h2>${title}</h2>
                <p>Descrição: ${description}</p>
                <p>Publicado em: ${uploadedAt}</p>
                <p>Visualizações: ${views}</p>
                <p>Duração: ${duracao}</p>
                <img src="${thumbnail}" alt="Thumbnail">
            `;
            outputDiv.appendChild(videoElement);
        } else {
            outputDiv.textContent = 'Nenhum vídeo ou áudio encontrado.';
        }
    } catch (error) {
        console.error('Erro ao baixar vídeo:', error);
        outputDiv.textContent = 'Ocorreu um erro ao processar a solicitação.';
    }
}
