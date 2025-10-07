import axios from "axios";

export const listDevices = async (event) => {
    try {

        const VALID_API_KEY = "AIzaSyAYIWRC7ATpF6mkbFEKrY8EH_Vk4oMGtrY";

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
                "Authorization": "Bearer 329b368d0e99b969d5d71c4fe5c58216b2001ce3",
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
