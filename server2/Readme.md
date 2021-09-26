#  Serverless-Sandbox
Serverless backend sandbox to test and prototype services and architectures. Works remote & offline with currently used services. Takes about 5 minutes to setup thanks to the [Serverless Framework](https://www.serverless.com/)!


##  Services used
- API Gateway
- Lambda
- DynamoDB
- CloudFormation
- S3 (for cloudformation deployment)



##  Run 
To run you must create a new IAM user account with administrator access for [serverless](https://www.serverless.com/) to use AWS CLI and SDK tools. You can then run the following commands.

### **Remote**

`npm i -g serverless`

`serverless config credentials --provider aws --key {iam-account-key} --secret {iam-account-secret} --profile {any-custom-name}`

Example :  `serverless config credentials --provider aws --key ASKDNG23K43JKADF --secret 123456 --profile serverlessUser`


Start :  `sls deploy`
`sls deploy -f onlyDeployFunctionName`

### **Offline**
`sls dynamodb install`
`sls serverless-offline install`

Start :  `sls offline start`




## Credits
Shout out to [Complete Coding](https://www.youtube.com/channel/UC8uBP0Un18DJAnWjm1CPqBg) for an awesome [course playlist](https://www.youtube.com/channel/UC8uBP0Un18DJAnWjm1CPqBg) on serverless.
