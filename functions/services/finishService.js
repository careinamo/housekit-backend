import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const DEVICES_TABLE = process.env.DEVICES_TABLE;
const SERVICES_TABLE = process.env.SERVICES_TABLE;

// Inicializa cliente DynamoDB
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const finishService = async (event) => {
    try {
        console.log("Event received:", JSON.stringify(event, null, 2));

        // 📦 Extraer payload del evento de EventBridge
        let payload;
        
        if (event.detail) {
            // Evento de EventBridge
            payload = event.detail;
        } else {
            // Invocación directa para testing
            payload = event;
        }

        const { house, device, user, timestamp } = payload;

        if (!house || !device || !user || !timestamp) {
            console.error("Payload incompleto:", payload);
            throw new Error("Los campos 'house', 'device', 'user' y 'timestamp' son requeridos en el payload.");
        }

        console.log(`Finalizando servicio: Device=${device}, User=${user}, House=${house}, Timestamp=${timestamp}`);

        // 2.1 🔄 Actualizar dispositivo - liberar userUsing
        const updateDeviceParams = {
            TableName: DEVICES_TABLE,
            Key: {
                PK: house,
                SK: device
            },
            UpdateExpression: "SET userUsing = :null",
            ExpressionAttributeValues: {
                ":null": null
            }
        };

        console.log("Actualizando dispositivo...");
        await ddbDocClient.send(new UpdateCommand(updateDeviceParams));

        // 2.2 📝 Actualizar registro de service - marcar como finalizado
        const now = new Date().toISOString();
        
        const updateServiceParams = {
            TableName: SERVICES_TABLE,
            Key: {
                PK: device,
                SK: timestamp // Usar timestamp como sort key
            },
            UpdateExpression: "SET finishedAt = :finishedAt",
            ExpressionAttributeValues: {
                ":finishedAt": now
            }
        };

        console.log("Actualizando registro de servicio...");
        await ddbDocClient.send(new UpdateCommand(updateServiceParams));

        console.log(`Servicio finalizado exitosamente a las ${now}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: "Servicio finalizado exitosamente.",
                data: {
                    device: device,
                    user: user,
                    house: house,
                    finishedAt: now
                }
            }),
        };

    } catch (error) {
        console.error("Error al finalizar servicio:", error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: "Error al finalizar servicio.",
                error: error.message
            }),
        };
    }
};