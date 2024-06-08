import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  PutCommand,
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'
import * as AWS from 'aws-sdk'
AWS.config.update({ region: 'REGION' })

const generateId = (): string => Math.random().toString(36).substring(2, 10)


type Group = {
  groupId: string
  members: string[]
  messages: any[]
}

export async function registerUser(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const client = new DynamoDBClient({})
  const dynamo = DynamoDBDocumentClient.from(client)
  const username = JSON.parse(event.body!).username
  const userId = generateId()
  const newUser = {
    userId,
    username,
    blockedUsers: [],
  }
  const command = new PutCommand({
    TableName: 'usersTable-01e0b26',
    Item: newUser,
  })

  try {
    const response = await dynamo.send(command)

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    }
  } catch (error) {
    console.error('DynamoDB Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to register user' }),
    }
  }
}

// export async function listTables(
//   event: APIGatewayProxyEvent
// ): Promise<APIGatewayProxyResult> {
//   const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' })
//   ddb.listTables({ Limit: 10 }, function (err, data) {
//     if (err) {
//       console.log('Error', err.code)
//       return { statusCode: 500, body: JSON.stringify(err) }
//     } else {
//       console.log('Table names are ', data.TableNames)
//       return { statusCode: 200, body: JSON.stringify(data.TableNames) }
//     }
//   })
//   return { statusCode: 500, body: 'Error listing tables.' }
// }

export async function manageBlock(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const { userId, targetId, action } = JSON.parse(event.body!)
  const client = new DynamoDBClient({})
  const dynamo = DynamoDBDocumentClient.from(client)
  try {
    const userResult = await dynamo.send(
      new GetCommand({ TableName: 'usersTable-01e0b26', Key: { userId } })
    )

    const user = userResult.Item

    if (!user) {
      return { statusCode: 404, body: 'User not found.' }
    }

    if (action === 'block') {
      if (!user.blockedUsers.includes(targetId)) {
        user.blockedUsers.push(targetId)
      }
    } else if (action === 'unblock') {
      user.blockedUsers = user.blockedUsers.filter(
        (id: string) => id !== targetId
      )
    }

    const command = new PutCommand({
      TableName: 'usersTable-01e0b26',
      Item: user,
    })
    const response = await dynamo.send(command)

    return {
      statusCode: 200,
      body: JSON.stringify({
        userId,
        blockedUsers: user.blockedUsers,
        response: JSON.stringify(response),
      }),
    }
  } catch (error) {
    console.error('DynamoDB Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to manage block status' }),
    }
  }
}

export async function sendMessage(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const client = new DynamoDBClient({})
  const dynamo = DynamoDBDocumentClient.from(client)
  const { senderId, receiverId, content } = JSON.parse(event.body!)
  try {
    const senderResult = await dynamo.send(
      new GetCommand({
        TableName: 'usersTable-01e0b26',
        Key: { userId: senderId },
      })
    )
    const receiverResult = await dynamo.send(
      new GetCommand({
        TableName: 'usersTable-01e0b26',
        Key: { userId: receiverId },
      })
    )

    const sender = senderResult.Item
    const receiver = receiverResult.Item

    if (!sender || !receiver) {
      return { statusCode: 404, body: 'Sender or receiver not found.' }
    }

    if (receiver.blockedUsers.includes(senderId)) {
      return { statusCode: 403, body: 'User is blocked.' }
    }

    const messageId = generateId()
    const newMessage = { messageId, senderId, receiverId, content }

    const command = new PutCommand({
      TableName: 'messagesTable-8b833f5',
      Item: newMessage,
    })

    try {
      await dynamo.send(command)

      return {
        statusCode: 200,
        body: JSON.stringify(newMessage),
      }
    } catch (error) {
      console.error('DynamoDB Error:', error)
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Failed to send message' }),
      }
    }
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to send message' }),
    }
  }
}
export async function createGroup(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const client = new DynamoDBClient({})
  const dynamo = DynamoDBDocumentClient.from(client)
  const { members } = JSON.parse(event.body!)
  const groupId = generateId()

  const newGroup: Group = {
    groupId,
    members,
    messages: [],
  }

  const command = new PutCommand({
    TableName: 'groupsTable-98bb8ec',
    Item: newGroup,
  })

  try {
    await dynamo.send(command)
    return {
      statusCode: 200,
      body: JSON.stringify(newGroup),
    }
  } catch (error) {
    console.error('DynamoDB Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to create group' }),
    }
  }
}

export async function manageGroupMembers(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const client = new DynamoDBClient({})
  const dynamo = DynamoDBDocumentClient.from(client)
  const { groupId, memberId, action } = JSON.parse(event.body!)

  try {
    const groupResult = await dynamo.send(
      new GetCommand({ TableName: 'groupsTable-98bb8ec', Key: { groupId } })
    )
    const group = groupResult.Item

    if (!group) {
      return { statusCode: 404, body: 'Group not found.' }
    }

    if (action === 'add' && !group.members.includes(memberId)) {
      group.members.push(memberId)
    } else if (action === 'remove') {
      group.members = group.members.filter((id: string) => id !== memberId)
    }

    const command = new PutCommand({
      TableName: 'groupsTable-98bb8ec',
      Item: group,
    })

    await dynamo.send(command)

    return {
      statusCode: 200,
      body: JSON.stringify(group),
    }
  } catch (error) {
    console.error('DynamoDB Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to manage group members' }),
    }
  }
}

export async function getMessages(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const client = new DynamoDBClient({})
  const dynamo = DynamoDBDocumentClient.from(client)
  const { userId, groupId } = JSON.parse(event.body!)

  try {
    if (userId) {
      const params = {
        TableName: 'messagesTable-8b833f5',
        IndexName: 'SenderIdIndex', // Assumes GSI on senderId
        KeyConditionExpression: 'senderId = :senderId',
        ExpressionAttributeValues: {
          ':senderId': userId,
        },
      }

      const result = await dynamo.send(new QueryCommand(params))
      return {
        statusCode: 200,
        body: JSON.stringify(result.Items),
      }
    } else if (groupId) {
      const groupResult = await dynamo.send(
        new GetCommand({ TableName: 'groupsTable-98bb8ec', Key: { groupId } })
      )
      const group = groupResult.Item

      if (group) {
        return {
          statusCode: 200,
          body: JSON.stringify(group.messages), // Assuming messages are stored in the Groups table, which may require a design change
        }
      }
      return { statusCode: 404, body: 'Group not found.' }
    }
    return { statusCode: 400, body: 'Invalid request parameters.' }
  } catch (error) {
    console.error('DynamoDB Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to retrieve messages' }),
    }
  }
}

export async function checkBlockStatus(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const client = new DynamoDBClient({})
  const dynamo = DynamoDBDocumentClient.from(client)
  const { userId, targetId } = JSON.parse(event.body!)
  const params = {
    TableName: 'usersTable-01e0b26',
    Key: {
      userId,
    },
  }

  try {
    const data = await dynamo.send(new GetCommand(params))
    if (data.Item) {
      const isBlocked = data.Item.blockedUsers.includes(targetId)
      const message = isBlocked ? 'User is blocked.' : 'User is not blocked.'
      return { statusCode: 200, body: message }
    }
    return { statusCode: 404, body: 'User not found.' }
  } catch (error) {
    console.error('Error', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to check block status' }),
    }
  }
}

export async function getUsers(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const client = new DynamoDBClient({})
  const dynamo = DynamoDBDocumentClient.from(client)
  const params = {
    TableName: 'usersTable-01e0b26',
  }

  try {
    const data = await dynamo.send(new ScanCommand(params))
    console.log('data : ', data)
    return {
      statusCode: 200,
      body: JSON.stringify(data.Items),
    }
  } catch (error) {
    console.error('Error', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to retrieve users' }),
    }
  }
}
