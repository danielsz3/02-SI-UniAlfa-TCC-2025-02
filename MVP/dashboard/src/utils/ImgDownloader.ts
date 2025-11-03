export async function urlToFile(url: string, filename: string): Promise<File | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Falha ao baixar a imagem: ${response.statusText}`);
        }
        const blob = await response.blob();

        const mimeType = blob.type || 'image/jpeg';
        const finalFilename = filename || url.substring(url.lastIndexOf('/') + 1) || 'image.jpg';

        return new File([blob], finalFilename, { type: mimeType });

    } catch (e) {
        console.error("Erro ao converter URL para File:", url, e);
        return null;
    }
}