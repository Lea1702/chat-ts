import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

interface User {
  userId: string
  username: string
  blockedUsers: string[]
}

interface Group {
  groupId: string
  members: string[]
  messages: Message[]
}

interface Message {
  messageId: string
  senderId: string
  content: string
}

// Simulated in-memory storage
const users: User[] = []
const groups: Group[] = []
const messages: Message[] = []

// Helper function to generate a UUID
const generateId = (): string => Math.random().toString(36).substring(2, 10)

// Register a new user
export async function registerUser(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const username = JSON.parse(event.body!).username
  const userId = generateId()
  const newUser: User = { userId, username, blockedUsers: [] }
  users.push(newUser)
  return {
    statusCode: 200,
    body: JSON.stringify(newUser),
  }
}

// Send a message from one user to another
export async function sendMessage(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const { senderId, receiverId, content } = JSON.parse(event.body!)
  const sender = users.find((user) => user.userId === senderId)
  const receiver = users.find((user) => user.userId === receiverId)

  if (!sender || !receiver) {
    return { statusCode: 404, body: 'Sender or receiver not found.' }
  }

  if (sender.blockedUsers.includes(receiverId)) {
    return { statusCode: 403, body: 'User is blocked.' }
  }

  const newMessage: Message = { messageId: generateId(), senderId, content }
  messages.push(newMessage)
  return {
    statusCode: 200,
    body: JSON.stringify(newMessage),
  }
}

// Check if the user is blocked from sending messages
export async function checkBlockStatus(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const { userId, targetId } = JSON.parse(event.body!)
  const user = users.find((user) => user.userId === userId)
  if (user && user.blockedUsers.includes(targetId)) {
    return { statusCode: 200, body: 'User is blocked.' }
  }
  return { statusCode: 200, body: 'User is not blocked.' }
}

export async function getUsers(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  return { statusCode: 200, body: users.toString() }
}

// Manage blocking/unblocking users
export async function manageBlock(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const { userId, targetId, action } = JSON.parse(event.body!)
  const user = users.find((user) => user.userId === userId)
  if (!user) {
    return { statusCode: 404, body: 'User not found.' }
  }

  if (action === 'block') {
    user.blockedUsers.push(targetId)
  } else if (action === 'unblock') {
    user.blockedUsers = user.blockedUsers.filter((id) => id !== targetId)
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ userId, blockedUsers: user.blockedUsers }),
  }
}

// Create a group
export async function createGroup(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const { members } = JSON.parse(event.body!)
  const groupId = generateId()
  const newGroup: Group = { groupId, members, messages: [] }
  groups.push(newGroup)
  return {
    statusCode: 200,
    body: JSON.stringify(newGroup),
  }
}

// Manage group members (add/remove)
export async function manageGroupMembers(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const { groupId, memberId, action } = JSON.parse(event.body!)
  const group = groups.find((group) => group.groupId === groupId)
  if (!group) {
    return { statusCode: 404, body: 'Group not found.' }
  }

  if (action === 'add') {
    group.members.push(memberId)
  } else if (action === 'remove') {
    group.members = group.members.filter((id) => id !== memberId)
  }

  return { statusCode: 200, body: JSON.stringify(group) }
}

// Retrieve messages for a user or group
export async function getMessages(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const { userId, groupId } = JSON.parse(event.body!)
  if (userId) {
    const userMessages = messages.filter((msg) => msg.senderId === userId)
    return { statusCode: 200, body: JSON.stringify(userMessages) }
  } else if (groupId) {
    const group = groups.find((g) => g.groupId === groupId)
    if (group) {
      return { statusCode: 200, body: JSON.stringify(group.messages) }
    }
    return { statusCode: 404, body: 'Group not found.' }
  }
  return { statusCode: 400, body: 'Invalid request parameters.' }
}
