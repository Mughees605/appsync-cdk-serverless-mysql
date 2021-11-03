"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppSyncMySQLStack = void 0;
const cdk = require("@aws-cdk/core");
const aws_lambda_1 = require("@aws-cdk/aws-lambda");
const aws_ec2_1 = require("@aws-cdk/aws-ec2");
const lambda = require("@aws-cdk/aws-lambda");
const appsync = require("@aws-cdk/aws-appsync");
const iam = require("@aws-cdk/aws-iam");
const config_1 = require("../../configs/config");
const aws_rds_1 = require("@aws-cdk/aws-rds");
const aws_secretsmanager_1 = require("@aws-cdk/aws-secretsmanager");
const aws_appsync_1 = require("@aws-cdk/aws-appsync");
class AppSyncMySQLStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const { NODE_ENV, publicSubnetIds, availabilityZones, vpcId, DB_NAME, DB_CLUSTER_ID, DB_SECRET, DB_HOST, DB_PASSWORD, DB_USER, DB_PORT, } = config_1.config;
        const environment = {
            NODE_ENV,
        };
        const dbSecret = aws_secretsmanager_1.Secret.fromSecretAttributes(this, 'dbSecret', {
            secretArn: DB_SECRET
        });
        const dbArn = `arn:aws:rds:${this.region}:${this.account}:cluster:${DB_CLUSTER_ID}`;
        const vpc = aws_ec2_1.Vpc.fromVpcAttributes(this, 'Vpc', {
            vpcId,
            availabilityZones,
            publicSubnetIds
        });
        // -------------ROLE DEFINITIONS----------------- //
        const BlogPostFunction = new aws_lambda_1.Function(this, "BlogPostFunction", {
            runtime: aws_lambda_1.Runtime.NODEJS_12_X,
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
        });
        dbSecret.grantRead(BlogPostFunction);
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
        });
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
        });
        const serverlessCluster = aws_rds_1.ServerlessCluster.fromServerlessClusterAttributes(this, 'Aurora cluster', {
            clusterIdentifier: DB_CLUSTER_ID
        });
        const rdsDs = api.addRdsDataSource("BlogPostRDS", serverlessCluster, dbSecret, DB_NAME);
        const lambdaDs = api.addLambdaDataSource("BlogPostFunction", BlogPostFunction);
        lambdaDs.createResolver({
            typeName: "Mutation",
            fieldName: "createPost",
            requestMappingTemplate: aws_appsync_1.MappingTemplate.fromFile('stacks/serverless/appsync/mapping-templates/createPost.request.vtl'),
            responseMappingTemplate: aws_appsync_1.MappingTemplate.fromFile('stacks/serverless/appsync/mapping-templates/createPost.response.vtl')
        });
        rdsDs.createResolver({
            typeName: "Mutation",
            fieldName: "createPostAurora",
            requestMappingTemplate: aws_appsync_1.MappingTemplate.fromFile('stacks/serverless/appsync/mapping-templates/createPostAurora.request.vtl'),
            responseMappingTemplate: aws_appsync_1.MappingTemplate.fromFile('stacks/serverless/appsync/mapping-templates/createPostAurora.response.vtl')
        });
        rdsDs.createResolver({
            typeName: "Query",
            fieldName: "listPosts",
            requestMappingTemplate: aws_appsync_1.MappingTemplate.fromFile('stacks/serverless/appsync/mapping-templates/listPosts.request.vtl'),
            responseMappingTemplate: aws_appsync_1.MappingTemplate.fromFile('stacks/serverless/appsync/mapping-templates/listPosts.response.vtl')
        });
        const createPostAuroraFunction = new appsync.AppsyncFunction(this, 'createPostAuroraFunction', {
            api,
            name: 'createPostAuroraFunction',
            description: 'createPostAuroraFunction',
            dataSource: rdsDs,
            requestMappingTemplate: aws_appsync_1.MappingTemplate.fromFile('stacks/serverless/appsync/mapping-templates/function.createPostAuroraFunction.request.vtl'),
            responseMappingTemplate: aws_appsync_1.MappingTemplate.fromFile('stacks/serverless/appsync/mapping-templates/function.createPostAuroraFunction.response.vtl')
        });
        new appsync.Resolver(this, 'pipeline', {
            api,
            typeName: 'Mutation',
            fieldName: 'createPostAuroraPipeline',
            requestMappingTemplate: aws_appsync_1.MappingTemplate.fromFile('stacks/serverless/appsync/mapping-templates/pipeline.before.vtl'),
            responseMappingTemplate: aws_appsync_1.MappingTemplate.fromFile('stacks/serverless/appsync/mapping-templates/pipeline.after.vtl'),
            pipelineConfig: [
                createPostAuroraFunction
            ]
        });
    }
}
exports.AppSyncMySQLStack = AppSyncMySQLStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVybGVzcy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlcnZlcmxlc3Mtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUNBQW9DO0FBQ3BDLG9EQUc0QjtBQUM1Qiw4Q0FBc0M7QUFDdEMsOENBQTZDO0FBQzdDLGdEQUErQztBQUUvQyx3Q0FBdUM7QUFDdkMsaURBQTZDO0FBQzdDLDhDQUFvRDtBQUNwRCxvRUFBb0Q7QUFDcEQsc0RBQXNEO0FBRXRELE1BQWEsaUJBQWtCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDNUMsWUFBWSxLQUFvQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUNoRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUV2QixNQUFNLEVBQ0YsUUFBUSxFQUNSLGVBQWUsRUFDZixpQkFBaUIsRUFDakIsS0FBSyxFQUNMLE9BQU8sRUFDUCxhQUFhLEVBQ2IsU0FBUyxFQUNULE9BQU8sRUFDUCxXQUFXLEVBQ1gsT0FBTyxFQUNQLE9BQU8sR0FFVixHQUFHLGVBQU0sQ0FBQTtRQUVWLE1BQU0sV0FBVyxHQUFHO1lBQ2hCLFFBQVE7U0FDWCxDQUFBO1FBRUQsTUFBTSxRQUFRLEdBQUcsMkJBQU0sQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO1lBQzNELFNBQVMsRUFBRSxTQUFTO1NBQ3ZCLENBQUMsQ0FBQTtRQUVGLE1BQU0sS0FBSyxHQUFHLGVBQWUsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxZQUFZLGFBQWEsRUFBRSxDQUFBO1FBRW5GLE1BQU0sR0FBRyxHQUFHLGFBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO1lBQzNDLEtBQUs7WUFDTCxpQkFBaUI7WUFDakIsZUFBZTtTQUNsQixDQUFDLENBQUM7UUFFSCxvREFBb0Q7UUFFcEQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLHFCQUFRLENB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ICogYXMgY2RrIGZyb20gXCJAYXdzLWNkay9jb3JlXCJcbmltcG9ydCB7XG4gICAgRnVuY3Rpb24sXG4gICAgUnVudGltZSxcbn0gZnJvbSBcIkBhd3MtY2RrL2F3cy1sYW1iZGFcIlxuaW1wb3J0IHsgVnBjIH0gZnJvbSAnQGF3cy1jZGsvYXdzLWVjMidcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tIFwiQGF3cy1jZGsvYXdzLWxhbWJkYVwiXG5pbXBvcnQgKiBhcyBhcHBzeW5jIGZyb20gXCJAYXdzLWNkay9hd3MtYXBwc3luY1wiXG5cbmltcG9ydCAqIGFzIGlhbSBmcm9tIFwiQGF3cy1jZGsvYXdzLWlhbVwiXG5pbXBvcnQgeyBjb25maWcgfSBmcm9tICcuLi8uLi9jb25maWdzL2NvbmZpZydcbmltcG9ydCB7IFNlcnZlcmxlc3NDbHVzdGVyIH0gZnJvbSAnQGF3cy1jZGsvYXdzLXJkcydcbmltcG9ydCB7IFNlY3JldCB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1zZWNyZXRzbWFuYWdlcidcbmltcG9ydCB7IE1hcHBpbmdUZW1wbGF0ZSB9IGZyb20gXCJAYXdzLWNkay9hd3MtYXBwc3luY1wiXG5cbmV4cG9ydCBjbGFzcyBBcHBTeW5jTXlTUUxTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5Db25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcylcblxuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBOT0RFX0VOVixcbiAgICAgICAgICAgIHB1YmxpY1N1Ym5ldElkcyxcbiAgICAgICAgICAgIGF2YWlsYWJpbGl0eVpvbmVzLFxuICAgICAgICAgICAgdnBjSWQsXG4gICAgICAgICAgICBEQl9OQU1FLFxuICAgICAgICAgICAgREJfQ0xVU1RFUl9JRCxcbiAgICAgICAgICAgIERCX1NFQ1JFVCxcbiAgICAgICAgICAgIERCX0hPU1QsXG4gICAgICAgICAgICBEQl9QQVNTV09SRCxcbiAgICAgICAgICAgIERCX1VTRVIsXG4gICAgICAgICAgICBEQl9QT1JULFxuICAgICAgICAgICAgXG4gICAgICAgIH0gPSBjb25maWdcblxuICAgICAgICBjb25zdCBlbnZpcm9ubWVudCA9IHtcbiAgICAgICAgICAgIE5PREVfRU5WLFxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGJTZWNyZXQgPSBTZWNyZXQuZnJvbVNlY3JldEF0dHJpYnV0ZXModGhpcywgJ2RiU2VjcmV0Jywge1xuICAgICAgICAgICAgc2VjcmV0QXJuOiBEQl9TRUNSRVRcbiAgICAgICAgfSlcblxuICAgICAgICBjb25zdCBkYkFybiA9IGBhcm46YXdzOnJkczoke3RoaXMucmVnaW9ufToke3RoaXMuYWNjb3VudH06Y2x1c3Rlcjoke0RCX0NMVVNURVJfSUR9YFxuXG4gICAgICAgIGNvbnN0IHZwYyA9IFZwYy5mcm9tVnBjQXR0cmlidXRlcyh0aGlzLCAnVnBjJywge1xuICAgICAgICAgICAgdnBjSWQsXG4gICAgICAgICAgICBhdmFpbGFiaWxpdHlab25lcyxcbiAgICAgICAgICAgIHB1YmxpY1N1Ym5ldElkc1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tUk9MRSBERUZJTklUSU9OUy0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgICAgICAgY29uc3QgQmxvZ1Bvc3RGdW5jdGlvbiA9IG5ldyBGdW5jdGlvbih0aGlzLCBcIkJsb2dQb3N0RnVuY3Rpb25cIiwge1xuICAgICAgICAgICAgcnVudGltZTogUnVudGltZS5OT0RFSlNfMTJfWCxcbiAgICAgICAgICAgIGhhbmRsZXI6IFwiaW5kZXguaGFuZGxlclwiLFxuICAgICAgICAgICAgYWxsb3dQdWJsaWNTdWJuZXQ6IHRydWUsXG4gICAgICAgICAgICBjb2RlOiBuZXcgbGFtYmRhLkFzc2V0Q29kZSgnc3RhY2tzL3NlcnZlcmxlc3MvbGFtYmRhJyksXG4gICAgICAgICAgICB2cGMsXG4gICAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgICAgIC4uLmVudmlyb25tZW50LFxuICAgICAgICAgICAgICAgIERCX05BTUUsXG4gICAgICAgICAgICAgICAgREJfQ0xVU1RFUl9JRCxcbiAgICAgICAgICAgICAgICBEQl9TRUNSRVQsXG4gICAgICAgICAgICAgICAgREJfSE9TVCxcbiAgICAgICAgICAgICAgICBEQl9QQVNTV09SRCxcbiAgICAgICAgICAgICAgICBEQl9VU0VSLFxuICAgICAgICAgICAgICAgIERCX1BPUlQsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgICAgICBkYlNlY3JldC5ncmFudFJlYWQoQmxvZ1Bvc3RGdW5jdGlvbilcblxuICAgICAgICBjb25zdCBhcGkgPSBuZXcgYXBwc3luYy5HcmFwaHFsQXBpKHRoaXMsIGB0ZXN0LSR7Tk9ERV9FTlZ9LWFwaWAsIHtcbiAgICAgICAgICAgIG5hbWU6IGB0ZXN0LSR7Tk9ERV9FTlZ9YCxcbiAgICAgICAgICAgIGxvZ0NvbmZpZzoge1xuICAgICAgICAgICAgICAgIGZpZWxkTG9nTGV2ZWw6IGFwcHN5bmMuRmllbGRMb2dMZXZlbC5BTExcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzY2hlbWE6IGFwcHN5bmMuU2NoZW1hLmZyb21Bc3NldCgnc3RhY2tzL3NlcnZlcmxlc3MvYXBwc3luYy9zY2hlbWEuZ3JhcGhxbCcpLFxuICAgICAgICAgICAgYXV0aG9yaXphdGlvbkNvbmZpZzoge1xuICAgICAgICAgICAgICAgIGRlZmF1bHRBdXRob3JpemF0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcHBzeW5jLkF1dGhvcml6YXRpb25UeXBlLkFQSV9LRVksXG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgbmV3IGlhbS5Sb2xlKHRoaXMsICdhcHBzeW5jLXNlcnZpY2Utcm9sZScsIHtcbiAgICAgICAgICAgIHJvbGVOYW1lOiAnYXBwc3luYy1zZXJ2aWNlLXJvbGUnLFxuICAgICAgICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2FwcHN5bmMuYW1hem9uYXdzLmNvbScpLFxuICAgICAgICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgICAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdzZXJ2aWNlLXJvbGUvQVdTQXBwU3luY1B1c2hUb0Nsb3VkV2F0Y2hMb2dzJylcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBpbmxpbmVQb2xpY2llczoge1xuICAgICAgICAgICAgICAgICdhY2Nlc3MtcmRzJzogbmV3IGlhbS5Qb2xpY3lEb2N1bWVudCh7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudHM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogWydyZHM6KicsICdyZHMtZGF0YToqJ10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbZGJBcm5dXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogWydzZWNyZXRzbWFuYWdlcjoqJ10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbREJfU0VDUkVUXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgY29uc3Qgc2VydmVybGVzc0NsdXN0ZXIgPSBTZXJ2ZXJsZXNzQ2x1c3Rlci5mcm9tU2VydmVybGVzc0NsdXN0ZXJBdHRyaWJ1dGVzKFxuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgICdBdXJvcmEgY2x1c3RlcicsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY2x1c3RlcklkZW50aWZpZXI6IERCX0NMVVNURVJfSURcbiAgICAgICAgICAgIH1cbiAgICAgICAgKVxuXG4gICAgICAgIGNvbnN0IHJkc0RzID0gYXBpLmFkZFJkc0RhdGFTb3VyY2UoXCJCbG9nUG9zdFJEU1wiLCBzZXJ2ZXJsZXNzQ2x1c3RlciwgZGJTZWNyZXQsIERCX05BTUUpXG5cbiAgICAgICAgY29uc3QgbGFtYmRhRHMgPSBhcGkuYWRkTGFtYmRhRGF0YVNvdXJjZShcbiAgICAgICAgICAgIFwiQmxvZ1Bvc3RGdW5jdGlvblwiLFxuICAgICAgICAgICAgQmxvZ1Bvc3RGdW5jdGlvblxuICAgICAgICApXG5cbiAgICAgICAgbGFtYmRhRHMuY3JlYXRlUmVzb2x2ZXIoe1xuICAgICAgICAgICAgdHlwZU5hbWU6IFwiTXV0YXRpb25cIixcbiAgICAgICAgICAgIGZpZWxkTmFtZTogXCJjcmVhdGVQb3N0XCIsXG4gICAgICAgICAgICByZXF1ZXN0TWFwcGluZ1RlbXBsYXRlOiBNYXBwaW5nVGVtcGxhdGUuZnJvbUZpbGUoJ3N0YWNrcy9zZXJ2ZXJsZXNzL2FwcHN5bmMvbWFwcGluZy10ZW1wbGF0ZXMvY3JlYXRlUG9zdC5yZXF1ZXN0LnZ0bCcpLFxuICAgICAgICAgICAgcmVzcG9uc2VNYXBwaW5nVGVtcGxhdGU6IE1hcHBpbmdUZW1wbGF0ZS5mcm9tRmlsZSgnc3RhY2tzL3NlcnZlcmxlc3MvYXBwc3luYy9tYXBwaW5nLXRlbXBsYXRlcy9jcmVhdGVQb3N0LnJlc3BvbnNlLnZ0bCcpXG4gICAgICAgIH0pXG5cbiAgICAgICAgcmRzRHMuY3JlYXRlUmVzb2x2ZXIoe1xuICAgICAgICAgICAgdHlwZU5hbWU6IFwiTXV0YXRpb25cIixcbiAgICAgICAgICAgIGZpZWxkTmFtZTogXCJjcmVhdGVQb3N0QXVyb3JhXCIsXG4gICAgICAgICAgICByZXF1ZXN0TWFwcGluZ1RlbXBsYXRlOiBNYXBwaW5nVGVtcGxhdGUuZnJvbUZpbGUoJ3N0YWNrcy9zZXJ2ZXJsZXNzL2FwcHN5bmMvbWFwcGluZy10ZW1wbGF0ZXMvY3JlYXRlUG9zdEF1cm9yYS5yZXF1ZXN0LnZ0bCcpLFxuICAgICAgICAgICAgcmVzcG9uc2VNYXBwaW5nVGVtcGxhdGU6IE1hcHBpbmdUZW1wbGF0ZS5mcm9tRmlsZSgnc3RhY2tzL3NlcnZlcmxlc3MvYXBwc3luYy9tYXBwaW5nLXRlbXBsYXRlcy9jcmVhdGVQb3N0QXVyb3JhLnJlc3BvbnNlLnZ0bCcpXG4gICAgICAgIH0pXG5cbiAgICAgICAgcmRzRHMuY3JlYXRlUmVzb2x2ZXIoe1xuICAgICAgICAgICAgdHlwZU5hbWU6IFwiUXVlcnlcIixcbiAgICAgICAgICAgIGZpZWxkTmFtZTogXCJsaXN0UG9zdHNcIixcbiAgICAgICAgICAgIHJlcXVlc3RNYXBwaW5nVGVtcGxhdGU6IE1hcHBpbmdUZW1wbGF0ZS5mcm9tRmlsZSgnc3RhY2tzL3NlcnZlcmxlc3MvYXBwc3luYy9tYXBwaW5nLXRlbXBsYXRlcy9saXN0UG9zdHMucmVxdWVzdC52dGwnKSxcbiAgICAgICAgICAgIHJlc3BvbnNlTWFwcGluZ1RlbXBsYXRlOiBNYXBwaW5nVGVtcGxhdGUuZnJvbUZpbGUoJ3N0YWNrcy9zZXJ2ZXJsZXNzL2FwcHN5bmMvbWFwcGluZy10ZW1wbGF0ZXMvbGlzdFBvc3RzLnJlc3BvbnNlLnZ0bCcpXG4gICAgICAgIH0pXG5cblxuICAgICAgICBjb25zdCBjcmVhdGVQb3N0QXVyb3JhRnVuY3Rpb24gPSBuZXcgYXBwc3luYy5BcHBzeW5jRnVuY3Rpb24odGhpcywgJ2NyZWF0ZVBvc3RBdXJvcmFGdW5jdGlvbicsIHtcbiAgICAgICAgICAgIGFwaSxcbiAgICAgICAgICAgIG5hbWU6ICdjcmVhdGVQb3N0QXVyb3JhRnVuY3Rpb24nLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdjcmVhdGVQb3N0QXVyb3JhRnVuY3Rpb24nLFxuICAgICAgICAgICAgZGF0YVNvdXJjZTogcmRzRHMsXG4gICAgICAgICAgICByZXF1ZXN0TWFwcGluZ1RlbXBsYXRlOiBNYXBwaW5nVGVtcGxhdGUuZnJvbUZpbGUoXG4gICAgICAgICAgICAgICAgJ3N0YWNrcy9zZXJ2ZXJsZXNzL2FwcHN5bmMvbWFwcGluZy10ZW1wbGF0ZXMvZnVuY3Rpb24uY3JlYXRlUG9zdEF1cm9yYUZ1bmN0aW9uLnJlcXVlc3QudnRsJ1xuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIHJlc3BvbnNlTWFwcGluZ1RlbXBsYXRlOiBNYXBwaW5nVGVtcGxhdGUuZnJvbUZpbGUoXG4gICAgICAgICAgICAgICAgJ3N0YWNrcy9zZXJ2ZXJsZXNzL2FwcHN5bmMvbWFwcGluZy10ZW1wbGF0ZXMvZnVuY3Rpb24uY3JlYXRlUG9zdEF1cm9yYUZ1bmN0aW9uLnJlc3BvbnNlLnZ0bCdcbiAgICAgICAgICAgIClcbiAgICAgICAgfSlcblxuICAgICAgICBuZXcgYXBwc3luYy5SZXNvbHZlcih0aGlzLCAncGlwZWxpbmUnLCB7XG4gICAgICAgICAgICBhcGksXG4gICAgICAgICAgICB0eXBlTmFtZTogJ011dGF0aW9uJyxcbiAgICAgICAgICAgIGZpZWxkTmFtZTogJ2NyZWF0ZVBvc3RBdXJvcmFQaXBlbGluZScsXG4gICAgICAgICAgICByZXF1ZXN0TWFwcGluZ1RlbXBsYXRlOiBNYXBwaW5nVGVtcGxhdGUuZnJvbUZpbGUoXG4gICAgICAgICAgICAgICAgJ3N0YWNrcy9zZXJ2ZXJsZXNzL2FwcHN5bmMvbWFwcGluZy10ZW1wbGF0ZXMvcGlwZWxpbmUuYmVmb3JlLnZ0bCdcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICByZXNwb25zZU1hcHBpbmdUZW1wbGF0ZTogTWFwcGluZ1RlbXBsYXRlLmZyb21GaWxlKCdzdGFja3Mvc2VydmVybGVzcy9hcHBzeW5jL21hcHBpbmctdGVtcGxhdGVzL3BpcGVsaW5lLmFmdGVyLnZ0bCcpLFxuICAgICAgICAgICAgcGlwZWxpbmVDb25maWc6IFtcbiAgICAgICAgICAgICAgICBjcmVhdGVQb3N0QXVyb3JhRnVuY3Rpb25cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSlcbiAgICB9XG59XG4iXX0=