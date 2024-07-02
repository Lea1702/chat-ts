Here is an updated version of the README file with your instructions included:

---

# Project Setup Instructions

## Prerequisites
- Ensure you have the necessary permissions and tools installed:
  - AWS CLI
  - Node.js
  - Pulumi

## Steps to Run the Project

### For Mac Users
1. Run the `run.command` file.
2. Follow the instructions provided by the script.

### For Windows Users
1. Run the `runWindows.bat` file.
2. Follow the instructions provided by the script.

### Update Database Names
1. Go to the following link to get the DynamoDB table names:
   [AWS DynamoDB Console](https://il-central-1.console.aws.amazon.com/dynamodbv2/home?region=il-central-1#tables)
2. Open the `handler.ts` file.
3. Modify the database names in lines 19-21 to match the table names you retrieved from the AWS console.

### Run the Command File Again
1. After updating the `handler.ts` file, run the `run.command` (for Mac) or `runWindows.bat` (for Windows) file again.

## Example Code Snippet for `handler.ts`
Replace the placeholders with your actual DynamoDB table names:
```typescript
// handler.ts
const USERS_TABLE = "YOUR_FIRST_TABLE_NAME";  // Line 19
const MESSAGES_TABLE = "YOUR_SECOND_TABLE_NAME"; // Line 20
const GROUPS_TABLE = "YOUR_THIRD_TABLE_NAME";  // Line 21
```

By following these steps, you should be able to configure and run the project successfully.

---

This README now includes clear instructions for both Mac and Windows users, guiding them through the steps needed to run the project, update the database names, and rerun the command files.