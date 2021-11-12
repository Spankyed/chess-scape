#  Serverless-Backend
This serverless backend works remote & offline (with the AWS services currently used). Takes around 5 minutes to setup. Many thanks to the developers of the [Serverless Framework](https://www.serverless.com/) & community for all the awesome tooling!

##  Services used
- API Gateway
- Lambda
- DynamoDB
- CloudFormation
- S3 (user files + cloudformation deployment)
- Swagger 


##  Run 
To run you must create a new IAM user account with administrator access for the [Serverless Framework](https://www.serverless.com/) can use AWS CLI and SDK tools. Afterwards you can run the following commands:

### **Remote**
Setup & configure
`npm i -g serverless`
`serverless config credentials --provider aws --key {iam-account-key} --secret {iam-account-secret} --profile {any-custom-name}`
Config Example :  
`serverless config credentials --provider aws --key ABCDEFHGHIJ1234 --secret 123456 --profile serverlessUser`

Deploy all services:  
`sls deploy`
Deploy single function : 
`sls deploy -f onlyDeployFunctionName`

### **Offline**
Setup
`sls dynamodb install`
`sls serverless-offline install`

Start :  `sls offline start`

## Credits
Special thanks to [Complete Coding](https://www.youtube.com/channel/UC8uBP0Un18DJAnWjm1CPqBg) for the rockstar [course](https://www.youtube.com/channel/UC8uBP0Un18DJAnWjm1CPqBg) that teaches the basics of working with the Serverless framework.
