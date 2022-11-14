import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const TABLE_NAME = process.env.TABLE_NAME;

export default eventHandler(async () => {
  const command = new ScanCommand({
    TableName: TABLE_NAME,
  });
  const scaned = await ddbDocClient.send(command);
  return scaned.Items;
});
