import * as cdk from "@aws-cdk/core"
import {
    Function,
    Runtime,
} from "@aws-cdk/aws-lambda"
import { Vpc } from '@aws-cdk/aws-ec2'
import * as lambda from "@aws-cdk/aws-lambda"
import * as appsync from "@aws-cdk/aws-appsync"

import * as iam from "@aws-cdk/aws-iam"
import { config } from '../../configs/config'
import { ServerlessCluster } from '@aws-cdk/aws-rds'
import { Secret } from '@aws-cdk/aws-secretsmanager'
import { MappingTemplate } from "@aws-cdk/aws-appsync"

export class AppSyncMySQLStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        const {
            NODE_ENV,
            publicSubnetIds,
            availabilityZones,
            vpcId,
            DB_NAME,
            DB_CLUSTER_ID,
            DB_SECRET,
            DB_HOST,
            DB_PASSWORD,
            DB_USER,
            DB_PORT,
            
        } = config

        const environment = {
            NODE_ENV,
        }

        const dbSecret = Secret.fromSecretAttributes(this, 'dbSecret', {
            secretArn: DB_SECRET
        })

        const dbArn = `arn:aws:rds:${this.region}:${this.account}:cluster:${DB_CLUSTER_ID}`

        const vpc = Vpc.fromVpcAttributes(this, 'Vpc', {
            vpcId,
            availabilityZones,
            publicSubnetIds
        });

        // -------------ROLE DEFINITIONS----------------- //

        const BlogPostFunction = new Function(this, "BlogPostFunction", {
            runtime: Runtime.NODEJS_12_X,
            handler: "index.handler",
            allowPublicSubnet: true,
            code: new lambda.AssetCode('stacks/serverless/lambda'),
            vpc,
            environment: {
                ...environment,
                DB_NAME,
                DB_CLUSTER_ID,
                DB_SECRET,
                DB_HOST,
                DB_PASSWORD,
                DB_USER,
                DB_PORT,
            },
        })
        dbSecret.grantRead(BlogPostFunction)

        const api = new appsync.GraphqlApi(this, `test-${NODE_ENV}-api`, {
            name: `test-${NODE_ENV}`,
            logConfig: {
                fieldLogLevel: appsync.FieldLogLevel.ALL
            },
            schema: appsync.Schema.fromAsset('stacks/serverless/appsync/schema.graphql'),
            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: appsync.AuthorizationType.API_KEY,

                }
            }
        })

        new iam.Role(this, 'appsync-service-role', {
            roleName: 'appsync-service-role',
            assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppSyncPushToCloudWatchLogs')
            ],
            inlinePolicies: {
                'access-rds': new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: ['rds:*', 'rds-data:*'],
                            resources: [dbArn]
                        }),
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: ['secretsmanager:*'],
                            resources: [DB_SECRET]
                        })
                    ]
                })
            }
        })

        const serverlessCluster = ServerlessCluster.fromServerlessClusterAttributes(
            this,
            'Aurora cluster',
            {
                clusterIdentifier: DB_CLUSTER_ID
            }
        )

        const rdsDs = api.addRdsDataSource("BlogPostRDS", serverlessCluster, dbSecret, DB_NAME)

        const lambdaDs = api.addLambdaDataSource(
            "BlogPostFunction",
            BlogPostFunction
        )

        lambdaDs.createResolver({
            typeName: "Mutation",
            fieldName: "createPost",
            requestMappingTemplate: MappingTemplate.fromFile('stacks/serverless/appsync/mapping-templates/createPost.request.vtl'),
            responseMappingTemplate: MappingTemplate.fromFile('stacks/serverless/appsync/mapping-templates/createPost.response.vtl')
        })

        rdsDs.createResolver({
            typeName: "Mutation",
            fieldName: "createPostAurora",
            requestMappingTemplate: MappingTemplate.fromFile('stacks/serverless/appsync/mapping-templates/createPostAurora.request.vtl'),
            responseMappingTemplate: MappingTemplate.fromFile('stacks/serverless/appsync/mapping-templates/createPostAurora.response.vtl')
        })

        rdsDs.createResolver({
            typeName: "Query",
            fieldName: "listPosts",
            requestMappingTemplate: MappingTemplate.fromFile('stacks/serverless/appsync/mapping-templates/listPosts.request.vtl'),
            responseMappingTemplate: MappingTemplate.fromFile('stacks/serverless/appsync/mapping-templates/listPosts.response.vtl')
        })


        const createPostAuroraFunction = new appsync.AppsyncFunction(this, 'createPostAuroraFunction', {
            api,
            name: 'createPostAuroraFunction',
            description: 'createPostAuroraFunction',
            dataSource: rdsDs,
            requestMappingTemplate: MappingTemplate.fromFile(
                'stacks/serverless/appsync/mapping-templates/function.createPostAuroraFunction.request.vtl'
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                'stacks/serverless/appsync/mapping-templates/function.createPostAuroraFunction.response.vtl'
            )
        })

        new appsync.Resolver(this, 'pipeline', {
            api,
            typeName: 'Mutation',
            fieldName: 'createPostAuroraPipeline',
            requestMappingTemplate: MappingTemplate.fromFile(
                'stacks/serverless/appsync/mapping-templates/pipeline.before.vtl'
            ),
            responseMappingTemplate: MappingTemplate.fromFile('stacks/serverless/appsync/mapping-templates/pipeline.after.vtl'),
            pipelineConfig: [
                createPostAuroraFunction
            ]
        })
    }
}
