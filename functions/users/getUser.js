import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME;

// Inicializa cliente DynamoDB
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const getUser = async (event) => {
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

        // 📝 Obtener el documento del usuario desde path parameters
        const userDocument = event.pathParameters?.document;

        if (!userDocument || typeof userDocument !== "string") {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "El parámetro 'document' es requerido en la URL.",
                }),
            };
        }

        // 🔍 Consultar usando el GSI SKIndex
        const params = {
            TableName: USERS_TABLE_NAME,
            IndexName: "SKIndex",
            KeyConditionExpression: "SK = :userDocument",
            ExpressionAttributeValues: {
                ":userDocument": `user#${userDocument}`
            }
        };

        const result = await ddbDocClient.send(new QueryCommand(params));

        if (!result.Items || result.Items.length === 0) {
            return {
                statusCode: 404,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: `Usuario con documento '${userDocument}' no encontrado.`,
                }),
            };
        }

        // ✅ Respuesta exitosa
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: true,
                message: "Usuario encontrado exitosamente.",
                data: {
                    user: result.Items[0], // Primer resultado (debería ser único)
                    totalHouses: result.Items.length, // En cuántas casas está registrado
                    allHouses: result.Items // Todos los registros si está en múltiples casas
                }
            }),
        };

    } catch (error) {
        console.error("Error al consultar usuario:", error);

        // Manejo específico de errores de DynamoDB
        if (error.name === "ResourceNotFoundException") {
            return {
                statusCode: 404,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "La tabla de usuarios no existe.",
                }),
            };
        }

        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: false,
                message: "Error interno del servidor al consultar usuario.",
                error: error.message
            }),
        };
    }
};