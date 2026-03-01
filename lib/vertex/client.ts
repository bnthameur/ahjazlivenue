/**
 * Vertex AI Client for Google Cloud Platform
 * Supports Gemini Flash, Gemini Pro, and Imagen models
 */

import { GoogleAuth } from 'google-auth-library';

// Model identifiers
export const GEMINI_FLASH = 'gemini-2.0-flash-exp';
export const GEMINI_PRO = 'gemini-2.0-pro-exp';
export const IMAGEN_3 = 'imagen-3.0-generate-001';

export interface VertexAIConfig {
    projectId: string;
    location: string;
    serviceAccountKey?: string;
}

export interface TextGenerationRequest {
    model: typeof GEMINI_FLASH | typeof GEMINI_PRO;
    prompt: string;
    temperature?: number;
    maxTokens?: number;
    systemInstruction?: string;
}

export interface VisionGenerationRequest {
    model: typeof GEMINI_FLASH;
    prompt: string;
    imageData: string; // Base64 encoded image
    mimeType: string;
    temperature?: number;
    systemInstruction?: string;
}

export interface ImageGenerationRequest {
    model: typeof IMAGEN_3;
    prompt: string;
    aspectRatio?: '16:9' | '1:1' | '4:3' | '9:16';
    numberOfImages?: number;
}

export interface VertexAIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export class VertexAIClient {
    private auth: GoogleAuth;
    private projectId: string;
    private location: string;
    private baseUrl: string;

    constructor(config: VertexAIConfig) {
        this.projectId = config.projectId;
        this.location = config.location || 'us-central1';
        this.baseUrl = `https://${this.location}-aiplatform.googleapis.com/v1`;

        // Initialize Google Auth
        this.auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
            ...(config.serviceAccountKey && {
                credentials: JSON.parse(config.serviceAccountKey),
            }),
        });
    }

    /**
     * Generate text using Gemini Flash or Pro
     */
    async generateText(
        request: TextGenerationRequest
    ): Promise<VertexAIResponse<string>> {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${request.model}:generateContent`;

            const client = await this.auth.getClient();
            const accessToken = await client.getAccessToken();

            const payload = {
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: request.prompt }],
                    },
                ],
                generationConfig: {
                    temperature: request.temperature || 0.7,
                    maxOutputTokens: request.maxTokens || 8192,
                },
                ...(request.systemInstruction && {
                    systemInstruction: {
                        parts: [{ text: request.systemInstruction }],
                    },
                }),
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Vertex AI API error: ${error}`);
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

            return {
                success: true,
                data: text,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Generate content from image and text using Gemini Flash
     */
    async generateFromVision(
        request: VisionGenerationRequest
    ): Promise<VertexAIResponse<string>> {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${request.model}:generateContent`;

            const client = await this.auth.getClient();
            const accessToken = await client.getAccessToken();

            const payload = {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                inline_data: {
                                    mime_type: request.mimeType,
                                    data: request.imageData,
                                },
                            },
                            { text: request.prompt },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: request.temperature || 0.4,
                    maxOutputTokens: 8192,
                },
                ...(request.systemInstruction && {
                    systemInstruction: {
                        parts: [{ text: request.systemInstruction }],
                    },
                }),
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Vertex AI Vision API error: ${error}`);
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

            return {
                success: true,
                data: text,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Generate images using Imagen 3
     */
    async generateImage(
        request: ImageGenerationRequest
    ): Promise<VertexAIResponse<string[]>> {
        try {
            const endpoint = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${request.model}:predict`;

            const client = await this.auth.getClient();
            const accessToken = await client.getAccessToken();

            const payload = {
                instances: [
                    {
                        prompt: request.prompt,
                    },
                ],
                parameters: {
                    sampleCount: request.numberOfImages || 1,
                    aspectRatio: request.aspectRatio || '1:1',
                    safetySetting: 'block_some',
                    personGeneration: 'allow_adult',
                },
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Imagen API error: ${error}`);
            }

            const result = await response.json();
            const images = result.predictions.map(
                (pred: any) => pred.bytesBase64Encoded
            );

            return {
                success: true,
                data: images,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

/**
 * Singleton instance factory
 */
let vertexClient: VertexAIClient | null = null;

export function getVertexAIClient(): VertexAIClient {
    if (!vertexClient) {
        const config: VertexAIConfig = {
            projectId: process.env.GCP_PROJECT_ID!,
            location: process.env.GCP_LOCATION || 'us-central1',
            serviceAccountKey: process.env.GCP_SERVICE_ACCOUNT_KEY,
        };

        if (!config.projectId) {
            throw new Error('GCP_PROJECT_ID environment variable is required');
        }

        vertexClient = new VertexAIClient(config);
    }

    return vertexClient;
}
