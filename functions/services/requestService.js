import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SchedulerClient, CreateScheduleCommand } from "@aws-sdk/client-scheduler";
import axios from "axios";

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME;
const DEVICES_TABLE = process.env.DEVICES_TABLE;
const SERVICES_TABLE = process.env.SERVICES_TABLE;
const UNIQUE_TABLE = process.env.UNIQUE_TABLE;

// Inicializa clientes AWS
const dynamoClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(dynamoClient);
const schedulerClient = new SchedulerClient({});

export const requestService = async (event) => {
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

        // 📦 Parseamos el cuerpo recibido desde API Gateway
        const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
        
        if (!body || !body.house || !body.device || !body.user) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "Los campos 'house', 'device' y 'user' son requeridos.",
                }),
            };
        }

        const { house, device, user } = body;

        // 1.1 🔍 Obtener información del dispositivo
        const getDeviceParams = {
            TableName: DEVICES_TABLE,
            Key: {
                PK: house,
                SK: device
            }
        };

        const deviceResult = await ddbDocClient.send(new GetCommand(getDeviceParams));

        if (!deviceResult.Item) {
            return {
                statusCode: 404,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: `Dispositivo '${device}' no encontrado en la casa '${house}'.`,
                }),
            };
        }

        const deviceData = deviceResult.Item;

        // 1.2 ✅ Validar si el dispositivo está siendo usado
        if (deviceData.userUsing !== null && deviceData.userUsing !== undefined) {
            return {
                statusCode: 409,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "El dispositivo ya está siendo usado por otro usuario.",
                    userUsing: deviceData.userUsing
                }),
            };
        }

        // 1.3 👤 Obtener información del usuario
        const getUserParams = {
            TableName: USERS_TABLE_NAME,
            Key: {
                PK: house,
                SK: user
            }
        };

        const userResult = await ddbDocClient.send(new GetCommand(getUserParams));

        if (!userResult.Item) {
            return {
                statusCode: 404,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: `Usuario '${user}' no encontrado en la casa '${house}'.`,
                }),
            };
        }

        const userData = userResult.Item;
        const serviceType = deviceData.serviceType;
        const currentQuotes = userData.quotes[serviceType] || 0;

        // Validar que el usuario tenga cuotas disponibles
        if (currentQuotes <= 0) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: `No tienes cuotas disponibles para el servicio '${serviceType}'.`,
                    currentQuotes: currentQuotes
                }),
            };
        }

        // 1.4 � Encender dispositivo a través de CoolKit API
        console.log(`Encendiendo dispositivo: ${deviceData.coolKitDeviceId}`);
        
        // 🔑 Recuperar token desde DynamoDB
        const tokenParams = {
            TableName: UNIQUE_TABLE,
            Key: { PK: "ewelinkToken#1", SK: "ewelinkToken#1" }
        };

        const tokenResult = await ddbDocClient.send(new GetCommand(tokenParams));
        const token = tokenResult.Item?.data?.accessToken;
        
        if (!token) {
            return {
                statusCode: 500,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "No se encontró el token de CoolKit en DynamoDB.",
                }),
            };
        }

        // Verificar que el dispositivo tenga coolKitDeviceId
        if (!deviceData.coolKitDeviceId) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "El dispositivo no tiene configurado el coolKitDeviceId.",
                }),
            };
        }

        // 📡 Llamada a CoolKit para encender el dispositivo
        try {
            const coolKitResponse = await axios.post(
                "https://us-apia.coolkit.cc/v2/device/thing/status",
                {
                    type: 1,
                    id: deviceData.coolKitDeviceId,
                    params: {
                        switches: [{ switch: "on", outlet: 0 }],
                    },
                },
                {
                    headers: {
                        "X-CK-Nonce": "Ukz3EWWf",
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("Dispositivo encendido exitosamente:", coolKitResponse.data);
        } catch (coolKitError) {
            console.error("Error al encender el dispositivo:", coolKitError);
            return {
                statusCode: 500,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: false,
                    message: "Error al encender el dispositivo.",
                    error: coolKitError.response?.data || coolKitError.message
                }),
            };
        }

        // 1.5 �🔄 Actualizar dispositivo con userUsing (solo después de encender exitosamente)
        const updateDeviceParams = {
            TableName: DEVICES_TABLE,
            Key: {
                PK: house,
                SK: device
            },
            UpdateExpression: "SET userUsing = :userUsing",
            ExpressionAttributeValues: {
                ":userUsing": {
                    document: user,
                    name: userData.name
                }
            }
        };

        await ddbDocClient.send(new UpdateCommand(updateDeviceParams));

        // 1.6 📉 Decrementar cuotas del usuario
        const updateUserParams = {
            TableName: USERS_TABLE_NAME,
            Key: {
                PK: house,
                SK: user
            },
            UpdateExpression: `SET quotes.#serviceType = quotes.#serviceType - :one`,
            ExpressionAttributeNames: {
                "#serviceType": serviceType
            },
            ExpressionAttributeValues: {
                ":one": 1
            }
        };

        await ddbDocClient.send(new UpdateCommand(updateUserParams));

        // 1.7 📝 Crear registro en tabla de services
        const now = new Date();
        const estimatedEnd = new Date(now.getTime() + (5 * 60 * 1000)); // +1.5 horas
        const timestamp = now.getTime(); // Unix timestamp como número

        const serviceRecord = {
            PK: device,
            SK: timestamp, // Unix timestamp como número para sort key
            user: user, // Nuevo atributo user
            serviceType: serviceType,
            startedAt: now.toISOString(),
            finalEstimated: estimatedEnd.toISOString(),
            finishedAt: null
        };

        const putServiceParams = {
            TableName: SERVICES_TABLE,
            Item: serviceRecord
        };

        await ddbDocClient.send(new PutCommand(putServiceParams));

        // 1.8 ⏰ Crear schedule en EventBridge Scheduler
        const scheduleName = `finish-service-${user.replace('#', '-')}-${Date.now()}`;
        
        // Construir ARNs dinámicamente para evitar dependencias circulares
        const region = process.env.AWS_REGION || 'us-east-1';
        const accountId = process.env.AWS_ACCOUNT_ID;
        const stage = process.env.STAGE || 'dev';
        const serviceName = process.env.SERVICE_NAME || 'home-proyect';
        
        const finishServiceLambdaArn = `arn:aws:lambda:${region}:${accountId}:function:${serviceName}-${stage}-finishService`;
        const schedulerRoleArn = `arn:aws:iam::${accountId}:role/${serviceName}-${stage}-SchedulerRole`;
        
        const scheduleParams = {
            Name: scheduleName,
            ScheduleExpression: `at(${estimatedEnd.toISOString().slice(0, -5)})`, // Formato: at(2025-01-01T12:00:00)
            Target: {
                Arn: finishServiceLambdaArn,
                RoleArn: schedulerRoleArn,
                Input: JSON.stringify({
                    house: house,
                    device: device,
                    user: user,
                    timestamp: timestamp // Añadir timestamp para encontrar el registro correcto
                })
            },
            FlexibleTimeWindow: {
                Mode: "OFF"
            },
            State: "ENABLED"
        };

        await schedulerClient.send(new CreateScheduleCommand(scheduleParams));

        // ✅ Respuesta exitosa
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: true,
                message: "Servicio solicitado exitosamente.",
                data: {
                    service: serviceRecord,
                    device: {
                        name: deviceData.name,
                        serviceType: deviceData.serviceType
                    },
                    user: {
                        name: userData.name,
                        document: userData.document,
                        remainingQuotes: currentQuotes - 1
                    },
                    scheduledEndTime: estimatedEnd.toISOString(),
                    scheduleName: scheduleName
                }
            }),
        };

    } catch (error) {
        console.error("Error al solicitar servicio:", error);

        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: false,
                message: "Error interno del servidor.",
                error: error.message
            }),
        };
    }
};