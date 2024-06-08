import AWS from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import {
  DeleteItemOutput,
  DocumentClient,
  GetItemOutput,
  PutItemOutput,
  QueryOutput,
  ScanOutput,
  UpdateItemOutput,
} from 'aws-sdk/clients/dynamodb'
import { JsonDocumentType } from 'aws-sdk/clients/marketplacecatalog'

AWS.config.update({ region: 'eu-central-1' })
const dynamoDb = new AWS.DynamoDB.DocumentClient();
// Initialize DynamoDB document client
// const dynamoDb = new AWS.DynamoDB.DocumentClient()

// Helper function to generate a UUID
const generateId = (): string => Math.random().toString(36).substring(2, 10)

// Register a new user
export async function registerUser(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const username = JSON.parse(event.body!).username
  const userId = generateId()

  const params = {
    TableName: 'Users',
    Item: {
      userId,
      username,
      blockedUsers: [],
    },
  }

  try {
    dynamoDb.put(params, (err, data) => {
      if (err) {
        console.log('Error', err)
        return { statusCode: 500, body: err }
      }
      return {
        statusCode: 200,
        body: JSON.stringify(params.Item),
      }
    })
    return { statusCode: 500, body: 'Error registering user.' }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify(error) }
  }
}

// Send a message from one user to another
export async function sendMessage(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const { senderId, receiverId, content } = JSON.parse(event.body!)
  const messageId = generateId()

  const params = {
    TableName: 'Messages',
    Item: {
      messageId,
      senderId,
      receiverId,
      content,
      timestamp: new Date().toISOString(),
    },
  }

  try {
    await dynamoDb.put(params).promise()
    return {
      statusCode: 200,
      body: JSON.stringify(params.Item),
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify(error) }
  }
}

// Retrieve messages for a user
export async function getMessages(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult | undefined> {
  const { userId } = JSON.parse(event.body!)

  const params = {
    TableName: 'Messages',
    IndexName: 'ReceiverIdIndex', // Assume this index is setup in DynamoDB
    KeyConditionExpression: 'receiverId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
  }

  try {
    dynamoDb.query(params, (err, data) => {
      if (err) {
        console.log('Error', err)
        return { statusCode: 500, body: err }
      }
      return { statusCode: 200, body: JSON.stringify(data.Items) }
    })
    return { statusCode: 500, body: 'User not found.' }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify(error) }
  }
}

// Check if the user is blocked from sending messages
export async function checkBlockStatus(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const { userId, targetId } = JSON.parse(event.body!)

  const params = {
    TableName: 'Users',
    Key: {
      userId,
    },
  }
  try {
    dynamoDb.query(params, (err, data) => {
      if (err) {
        console.log('Error', err)
      }
      if (data.Items && data.Items[0]?.blockedUsers.includes(targetId)) {
        return { statusCode: 200, body: 'User is blocked.' }
      }
      return { statusCode: 200, body: 'User is not blocked.' }
    })
    return { statusCode: 404, body: 'User not found.' }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify(error) }
  }
}

export async function getUsers(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const params = {
    TableName: 'Users',
  }
  const users = await dynamoDb.scan(params).promise()
  return { statusCode: 200, body: users.toString() }
}

// Manage blocking/unblocking users
export async function manageBlock(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const { userId, targetId, action } = JSON.parse(event.body!)
  const params = {
    TableName: 'Users',
    Key: {
      userId,
    },
  }
  let blockedUsers: string[] = []
  dynamoDb.query(params, (err, data) => {
    if (err) {
      console.log('Error', err)
      return { statusCode: 500, body: err }
    }
    if (data.Items && data.Items[0]) {
      if (action === 'block') {
        blockedUsers.push(targetId)
      } else if (action === 'unblock') {
        blockedUsers = data.Items[0].blockedUsers.filter(
          (id: string) => id !== targetId
        )
      }
      return { statusCode: 200, body: 'User is already blocked.' }
    }
    return { statusCode: 404, body: 'User not found.' }
  })

  const paramsUpdate = {
    TableName: 'Users',
    Key: { userId },
    UpdateExpression: 'set blockedUsers=:val1',
    ExpressionAttributeValues: {
      ':val1': blockedUsers,
    },
  }

  dynamoDb.update(paramsUpdate, (err, data) => {
    if (err) {
      return { statusCode: 500, body: err }
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ userId, blockedUsers }),
    }
  })

  return { statusCode: 500, body: 'Error updating blocked users.' }
}

// Create a group
export async function createGroup(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const { members } = JSON.parse(event.body!)
  const groupId = generateId()

  const params = {
    TableName: 'Groups',
    Item: {
      groupId,
      members,
      messages: [],
    },
  }

  try {
    await dynamoDb.put(params).promise()
    return {
      statusCode: 200,
      body: JSON.stringify(params.Item),
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify(error) }
  }
}

// Manage group members (add/remove)
export async function manageGroupMembers(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const { groupId, memberId, action } = JSON.parse(event.body!)
  const params = {
    TableName: 'Groups',
    Key: {
      groupId,
    },
  }
  let groupMembers: string[] = []
  dynamoDb.query(params, (err, data) => {
    if (err) {
      console.log('Error', err)
      return { statusCode: 500, body: err }
    } else {
      //console.log("Success", data.Items);
      if (data.Items && data.Items[0]) {
        groupMembers = data.Items[0].members
        if (action === 'add') {
          groupMembers.push(memberId)
        } else if (action === 'remove') {
          groupMembers = groupMembers.filter((id: string) => id !== memberId)
        }
        return { statusCode: 200, body: 'User is already a member.' }
      }
      return { statusCode: 404, body: 'Group not found.' }
    }
  })

  const paramsUpdate = {
    TableName: 'Groups',
    Key: { groupId },
    UpdateExpression: 'set members=:val1',
    ExpressionAttributeValues: {
      ':val1': groupMembers,
    },
  }

  dynamoDb.update(paramsUpdate, (err, data) => {
    if (err) {
      return { statusCode: 500, body: err }
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({ groupId, members: groupMembers }),
      }
    }
  })
  return { statusCode: 500, body: 'Error updating group members.' }
}
