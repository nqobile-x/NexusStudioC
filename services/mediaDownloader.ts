export interface DownloadResult {
    blob: Blob;
    filename: string;
}

/**
 * Service to download media from social platforms using Cobalt API.
 * API Docs: https://github.com/imputnet/cobalt/blob/master/docs/api.md
 */
export class MediaDownloader {
    // Public instances of Cobalt API to try in order.
    // Using multiple instances for reliability.
    private readonly API_INSTANCES = [
        'https://co.wuk.sh/api/json',
        'https://api.cobalt.tools/api/json',
        'https://cobalt.api.red/api/json'
    ];

    /**
     * Downloads a video from a URL (YouTube, TikTok, Instagram, etc.)
     * @param url The share URL from the platform
     * @returns Blob of the video and a filename
     */
    async downloadMedia(url: string, onProgress?: (msg: string) => void): Promise<DownloadResult> {
        onProgress?.('Resolving URL...');

        let lastError: any;

        // Try each API instance in order
        for (const apiUrl of this.API_INSTANCES) {
            try {
                // console.log(`Trying API: ${apiUrl}`);
                return await this.downloadFromInstance(apiUrl, url, onProgress);
            } catch (error: any) {
                console.warn(`Failed with ${apiUrl}:`, error);
                lastError = error;
                // If it's a specific API error (like "content too long"), maybe don't retry? 
                // But for "Failed to fetch" (network/cors), definitely retry.
                continue;
            }
        }

        throw lastError || new Error('All download attempts failed.');
    }

    private async downloadFromInstance(apiUrl: string, url: string, onProgress?: (msg: string) => void): Promise<DownloadResult> {
        // 1. Request media info/stream from Cobalt
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                vQuality: '720',
                filenamePattern: 'nerdy',
                isAudioOnly: false,
                disableMetadata: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            // console.error('Cobalt API Error Response:', response.status, errorText);
            throw new Error(`API Error: ${response.status} ${errorText.substring(0, 100)}...`);
        }

        let data;
        try {
            const text = await response.text();
            data = JSON.parse(text);
        } catch (e) {
            throw new Error('Invalid JSON response from Cobalt API');
        }

        if (data.status === 'error') {
            // console.error('Cobalt API returned error status:', data);
            throw new Error(data.text || 'Unknown error from downloader API');
        }

        // Cobalt returns a 'url' in the JSON which is the direct stream/download link
        if (!data.url) {
            throw new Error('No download URL returned. Is this a playlist or photo slideshow?');
        }

        const downloadUrl = data.url;
        onProgress?.('Downloading Content...');

        // 2. Fetch the actual content
        const mediaRes = await fetch(downloadUrl);

        if (!mediaRes.ok) {
            throw new Error(`Failed to download media stream: ${mediaRes.status}`);
        }

        const blob = await mediaRes.blob();

        // Try to get filename from Content-Disposition or fallback
        let filename = 'downloaded_video.mp4';
        const disposition = mediaRes.headers.get('Content-Disposition');
        if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        } else if (data.filename) {
            filename = data.filename + '.mp4';
        }

        onProgress?.('Done!');
        return { blob, filename };
    }

    isValidUrl(url: string): boolean {
        try {
            const parsed = new URL(url);
            const hostname = parsed.hostname.toLowerCase();
            return (
                hostname.includes('youtube.com') ||
                hostname.includes('youtu.be') ||
                hostname.includes('tiktok.com') ||
                hostname.includes('instagram.com') ||
                hostname.includes('twitter.com') ||
                hostname.includes('x.com')
            );
        } catch {
            return false;
        }
    }
}

export const mediaDownloader = new MediaDownloader();
