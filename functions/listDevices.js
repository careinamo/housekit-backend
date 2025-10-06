import axios from "axios";

export const listDevices = async (event) => {
    try {

        const VALID_API_KEY = "MI_API_KEY_SECRETO_123";

        // 🔍 Leer encabezado x-api-key del request
        const apiKey = event.headers?.["x-api-key"] || event.headers?.["X-Api-Key"];

        if (!apiKey || apiKey !== VALID_API_KEY) {
            return {
                statusCode: 401,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "Invalid API key.",
                }),
            };
        }

        const response = await axios({
            method: "get",
            url: "https://us-apia.coolkit.cc/v2/device/thing",
            headers: {
                "X-CK-Nonce": "saZ2JWV0",
                "Authorization": "Bearer 04bcc2cd0b8b77214050ffcf3d69c1835ca6ede5",
                "Content-Type": "application/json",
            },
        });

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                success: true,
                data: response.data,
            }),
        };
    } catch (error) {
        console.error("Error al llamar al endpoint:", error);

        return {
            statusCode: error.response?.status || 500,
            body: JSON.stringify({
                success: false,
                message: error.message,
                details: error.response?.data || null,
            }),
        };
    }
};
