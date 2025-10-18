import axios from "axios";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
const UNIQUE_TABLE = process.env.UNIQUE_TABLE;

// Inicializa cliente DynamoDB
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

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

        // 🔑 Recuperar token desde DynamoDB
        const params = {
            TableName: UNIQUE_TABLE, // ⚠️ Cambia esto por tu nombre real de tabla
            Key: { PK: "ewelinkToken#1", SK: "ewelinkToken#1" }, // ⚠️ Cambia esto según tu clave primaria
        };

        const result = await ddbDocClient.send(new GetCommand(params));

        const token = result.Item?.data?.accessToken;
        if (!token) {            
            return {
                statusCode: 500,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "No se encontró el token en DynamoDB.",
                }),
            };
        }

        const response = await axios({
            method: "get",
            url: "https://us-apia.coolkit.cc/v2/device/thing",
            headers: {
                "X-CK-Nonce": "saZ2JWV0",
                Authorization: `Bearer ${token}`,
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
