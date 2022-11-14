import {
  AssetHashType,
  DockerImage,
  Duration,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { execSync } from "child_process";

export class NitroApiGatewayStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new Table(this, "Table", {
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    execSync(`yarn install`, {
      cwd: "nitro-app",
    });

    const inlineDynamicImportsFunction = new Function(
      this,
      "InlineDynamicImportsFunction",
      {
        functionName: "inline-dynamic-imports-function",
        handler: "index.handler",
        runtime: Runtime.NODEJS_16_X,
        code: Code.fromAsset("nitro-app", {
          assetHashType: AssetHashType.OUTPUT,
          bundling: {
            image: DockerImage.fromRegistry("node:16"),
            local: {
              tryBundle(outputDir) {
                execSync(`INLINE_DYNAMIC_IMPORTS='true' yarn build`, {
                  cwd: "nitro-app",
                });
                execSync(`mv nitro-app/.output/server/* ${outputDir}`);
                return true;
              },
            },
          },
        }),
        timeout: Duration.seconds(10),
        environment: {
          TABLE_NAME: table.tableName,
        },
      }
    );
    table.grantReadData(inlineDynamicImportsFunction);

    const chunkedFunction = new Function(this, "ChunkedFunction", {
      functionName: "chunked-function",
      handler: "index.handler",
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset("nitro-app2", {
        assetHashType: AssetHashType.OUTPUT,
        bundling: {
          image: DockerImage.fromRegistry("node:16"),
          local: {
            tryBundle(outputDir) {
              execSync(`INLINE_DYNAMIC_IMPORTS='false' yarn build`, {
                cwd: "nitro-app2",
              });
              execSync(`mv nitro-app2/.output/server/* ${outputDir}`);
              return true;
            },
          },
        },
      }),
      timeout: Duration.seconds(10),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantReadData(chunkedFunction);
  }
}
